const pool = require('../config/db');

// @route   GET /api/balance/my
// @desc    Get logged in user's leave balances
const getMyBalance = async (req, res) => {
  try {
    const [balances] = await pool.execute(`
      SELECT b.*, lt.name as leave_type_name
      FROM leave_balance b
      JOIN leave_types lt ON b.leave_type_id = lt.id
      WHERE b.user_id = ?
    `, [req.user.id]);
    
    res.json(balances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyBalance
};
