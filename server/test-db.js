const pool = require('./config/db');

(async () => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('Database connected successfully. Solution:', rows[0].solution);
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    process.exit();
  }
})();
