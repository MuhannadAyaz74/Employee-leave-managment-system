/**
 * Seed script — run once: node seed.js
 * Creates leave types and test users (admin, manager, employee)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected. Seeding...');

  // --- Leave Types ---
  await conn.query(`
    INSERT IGNORE INTO leave_types (id, name, description) VALUES
    (1, 'Annual Leave',  'Yearly paid leave'),
    (2, 'Sick Leave',    'Medical/health related leave'),
    (3, 'Casual Leave',  'Short personal leave'),
    (4, 'Unpaid Leave',  'Leave without pay')
  `);
  console.log('✅ Leave types seeded');

  // --- Users ---
  const adminHash   = await bcrypt.hash('admin123',   10);
  const managerHash = await bcrypt.hash('manager123', 10);
  const empHash     = await bcrypt.hash('emp123',     10);

  // Admin (id=1)
  await conn.query(`
    INSERT IGNORE INTO users (id, name, email, password, role) VALUES
    (1, 'Admin User', 'admin@elms.com', ?, 'admin')
  `, [adminHash]);

  // Manager (id=2, reports to admin)
  await conn.query(`
    INSERT IGNORE INTO users (id, name, email, password, role, manager_id) VALUES
    (2, 'Sara Khan', 'sara@elms.com', ?, 'manager', 1)
  `, [managerHash]);

  // Employee (id=3, reports to Sara)
  await conn.query(`
    INSERT IGNORE INTO users (id, name, email, password, role, manager_id) VALUES
    (3, 'Abdul Raheem', 'raheem@elms.com', ?, 'employee', 2)
  `, [empHash]);

  console.log('✅ Users seeded');

  // --- Leave Balances for employee ---
  await conn.query(`
    INSERT IGNORE INTO leave_balance (user_id, leave_type_id, total_leaves, used_leaves) VALUES
    (3, 1, 15, 0),
    (3, 2, 10, 0),
    (3, 3, 7,  0),
    (3, 4, 5,  0),
    (2, 1, 15, 0),
    (2, 2, 10, 0),
    (2, 3, 7,  0),
    (2, 4, 5,  0)
  `);
  console.log('✅ Leave balances seeded');

  await conn.end();
  console.log('\n🎉 Seed complete! Test credentials:');
  console.log('   Admin:    admin@elms.com   / admin123');
  console.log('   Manager:  sara@elms.com    / manager123');
  console.log('   Employee: raheem@elms.com  / emp123');
})();
