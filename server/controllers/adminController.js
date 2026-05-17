const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to check admin
const checkAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return false;
  }
  return true;
};

// Users
const getUsers = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const [users] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.role, u.manager_id, m.name as manager_name, u.created_at
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createUser = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const connection = await pool.getConnection();
  try {
    const { name, email, password, role, manager_id } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await connection.beginTransaction();

    // Create the user
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, manager_id || null]
    );
    const newUserId = result.insertId;

    // Auto-initialize leave_balance for every existing leave type
    // Default quotas: Annual=20, Sick=10, Casual=7, Unpaid=30
    const defaultQuotas = { 'Annual Leave': 20, 'Sick Leave': 10, 'Casual Leave': 7, 'Unpaid Leave': 30 };
    const [leaveTypes] = await connection.execute('SELECT id, name FROM leave_types');

    for (const lt of leaveTypes) {
      const quota = defaultQuotas[lt.name] ?? 15; // fallback: 15 days
      await connection.execute(
        'INSERT INTO leave_balance (user_id, leave_type_id, total_leaves, used_leaves) VALUES (?, ?, ?, 0)',
        [newUserId, lt.id, quota]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'User created successfully with leave balances initialized' });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

const deleteUser = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Cannot delete user (likely has associated records)' });
  }
};

// Leave Types
const getLeaveTypes = async (req, res) => {
  try {
    const [types] = await pool.execute('SELECT * FROM leave_types');
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createLeaveType = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { name, description } = req.body;
    await pool.execute('INSERT INTO leave_types (name, description) VALUES (?, ?)', [name, description]);
    res.status(201).json({ message: 'Leave type created' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// All Leaves (System wide)
const getAllLeaves = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const [leaves] = await pool.execute(`
      SELECT l.*, lt.name as leave_type_name, u.name as user_name
      FROM leaves l 
      JOIN leave_types lt ON l.leave_type_id = lt.id 
      JOIN users u ON l.user_id = u.id
      ORDER BY l.applied_at DESC
    `);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  createUser,
  deleteUser,
  getLeaveTypes,
  createLeaveType,
  getAllLeaves
};
