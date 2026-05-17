const pool = require('../config/db');

// @route   POST /api/leaves/apply
// @desc    Employee applies for leave
const applyLeave = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { leave_type_id, start_date, end_date, total_days, reason } = req.body;
    const user_id = req.user.id;

    // Check leave balance
    const [balanceRows] = await connection.execute(
      'SELECT remaining_leaves FROM leave_balance WHERE user_id = ? AND leave_type_id = ?',
      [user_id, leave_type_id]
    );

    if (balanceRows.length === 0 || balanceRows[0].remaining_leaves < total_days) {
      return res.status(400).json({ message: 'Insufficient leave balance for this type.' });
    }

    await connection.beginTransaction();

    // Insert leave
    const [leaveResult] = await connection.execute(
      'INSERT INTO leaves (user_id, leave_type_id, start_date, end_date, total_days, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, leave_type_id, start_date, end_date, total_days, reason, 'pending']
    );

    const leave_id = leaveResult.insertId;

    if (req.file) {
      await connection.execute(
        'INSERT INTO leave_attachments (leave_id, file_url) VALUES (?, ?)',
        [leave_id, `/uploads/${req.file.filename}`]
      );
    }

    // Insert log
    await connection.execute(
      'INSERT INTO leave_logs (leave_id, action, action_by, comment) VALUES (?, ?, ?, ?)',
      [leave_id, 'applied', user_id, 'Leave applied successfully']
    );

    // Notify manager
    const [userRows] = await connection.execute('SELECT manager_id, name FROM users WHERE id = ?', [user_id]);
    const manager_id = userRows[0].manager_id;

    if (manager_id) {
      await connection.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [manager_id, `${userRows[0].name} has applied for leave.`]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Leave applied successfully', leave_id });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error while applying leave' });
  } finally {
    connection.release();
  }
};

// @route   GET /api/leaves/my
// @desc    Get logged-in user's leaves
const getMyLeaves = async (req, res) => {
  try {
    const [leaves] = await pool.execute(`
      SELECT l.*, lt.name as leave_type_name 
      FROM leaves l 
      JOIN leave_types lt ON l.leave_type_id = lt.id 
      WHERE l.user_id = ? 
      ORDER BY l.applied_at DESC
    `, [req.user.id]);
    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/leaves/:id
// @desc    Get single leave detail
const getLeaveById = async (req, res) => {
  try {
    const [leaves] = await pool.execute(`
      SELECT l.*, lt.name as leave_type_name, u.name as user_name
      FROM leaves l 
      JOIN leave_types lt ON l.leave_type_id = lt.id
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `, [req.params.id]);

    if (leaves.length === 0) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    const leave = leaves[0];

    // Basic authorization check
    if (leave.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    // Fetch logs
    const [logs] = await pool.execute(`
      SELECT ll.*, u.name as action_by_name 
      FROM leave_logs ll 
      JOIN users u ON ll.action_by = u.id 
      WHERE ll.leave_id = ?
      ORDER BY ll.action_at ASC
    `, [leave.id]);
    
    // Fetch attachments
    const [attachments] = await pool.execute(
      'SELECT * FROM leave_attachments WHERE leave_id = ?',
      [leave.id]
    );

    res.json({ leave, logs, attachments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /api/leaves/:id/cancel
// @desc    Employee cancels leave
const cancelLeave = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const leaveId = req.params.id;
    const userId = req.user.id;

    const [leaves] = await connection.execute(
      'SELECT status FROM leaves WHERE id = ? AND user_id = ?',
      [leaveId, userId]
    );

    if (leaves.length === 0) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leaves[0].status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending leaves' });
    }

    await connection.beginTransaction();

    await connection.execute(
      'UPDATE leaves SET status = ? WHERE id = ?',
      ['cancelled', leaveId]
    );

    await connection.execute(
      'INSERT INTO leave_logs (leave_id, action, action_by, comment) VALUES (?, ?, ?, ?)',
      [leaveId, 'cancelled', userId, 'Leave cancelled by employee']
    );

    await connection.commit();
    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// @route   GET /api/leaves/types
// @desc    Get all leave types
const getLeaveTypes = async (req, res) => {
  try {
    const [types] = await pool.execute('SELECT * FROM leave_types');
    res.json(types);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/leaves/pending
// @desc    Manager gets pending leaves of their team
const getPendingLeaves = async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let query = `
      SELECT l.*, lt.name as leave_type_name, u.name as user_name
      FROM leaves l 
      JOIN leave_types lt ON l.leave_type_id = lt.id 
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'pending'
    `;
    let params = [];

    if (req.user.role === 'manager') {
      query += ` AND u.manager_id = ?`;
      params.push(req.user.id);
    }
    
    query += ` ORDER BY l.applied_at DESC`;

    const [leaves] = await pool.execute(query, params);
    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /api/leaves/:id/approve
// @desc    Manager approves leave
const approveLeave = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const leaveId = req.params.id;
    const managerId = req.user.id;
    const { manager_comment } = req.body; // ← NEW: optional comment

    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Verify leave exists and is pending
    const [leaves] = await connection.execute(
      'SELECT l.status, l.user_id, l.total_days, l.leave_type_id FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.id = ? ' + (req.user.role === 'manager' ? 'AND u.manager_id = ?' : ''),
      req.user.role === 'manager' ? [leaveId, managerId] : [leaveId]
    );

    if (leaves.length === 0) {
      return res.status(404).json({ message: 'Leave not found or unauthorized' });
    }

    if (leaves[0].status !== 'pending') {
      return res.status(400).json({ message: 'Leave is not pending' });
    }

    await connection.beginTransaction();

    // Update leave status (+ save manager_comment if provided)
    await connection.execute(
      'UPDATE leaves SET status = ?, manager_comment = ? WHERE id = ?',
      ['approved', manager_comment || null, leaveId]
    );

    // Deduct leave balance
    await connection.execute(
      'UPDATE leave_balance SET used_leaves = used_leaves + ? WHERE user_id = ? AND leave_type_id = ?',
      [leaves[0].total_days, leaves[0].user_id, leaves[0].leave_type_id]
    );

    // Add log (include the comment)
    await connection.execute(
      'INSERT INTO leave_logs (leave_id, action, action_by, comment) VALUES (?, ?, ?, ?)',
      [leaveId, 'approved', managerId, manager_comment || 'Leave approved by manager']
    );

    // Notify employee
    await connection.execute(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [leaves[0].user_id, `Your leave application has been approved.`]
    );

    await connection.commit();
    res.json({ message: 'Leave approved successfully' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// @route   PUT /api/leaves/:id/reject
// @desc    Manager rejects leave
const rejectLeave = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const leaveId = req.params.id;
    const managerId = req.user.id;
    const { manager_comment } = req.body;

    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const [leaves] = await connection.execute(
      'SELECT l.status, l.user_id FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.id = ? ' + (req.user.role === 'manager' ? 'AND u.manager_id = ?' : ''),
      req.user.role === 'manager' ? [leaveId, managerId] : [leaveId]
    );

    if (leaves.length === 0) {
      return res.status(404).json({ message: 'Leave not found or unauthorized' });
    }

    if (leaves[0].status !== 'pending') {
      return res.status(400).json({ message: 'Leave is not pending' });
    }

    await connection.beginTransaction();

    // Update leave status
    await connection.execute(
      'UPDATE leaves SET status = ?, manager_comment = ? WHERE id = ?',
      ['rejected', manager_comment || '', leaveId]
    );

    // Add log
    await connection.execute(
      'INSERT INTO leave_logs (leave_id, action, action_by, comment) VALUES (?, ?, ?, ?)',
      [leaveId, 'rejected', managerId, manager_comment || 'Leave rejected by manager']
    );

    // Notify employee
    await connection.execute(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [leaves[0].user_id, `Your leave application has been rejected.`]
    );

    await connection.commit();
    res.json({ message: 'Leave rejected successfully' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getLeaveById,
  cancelLeave,
  getLeaveTypes,
  getPendingLeaves,
  approveLeave,
  rejectLeave
};
