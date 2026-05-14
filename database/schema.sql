-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS elms;
USE elms;

-- USERS Table
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'manager', 'employee') NOT NULL DEFAULT 'employee',
  manager_id  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- LEAVE_TYPES Table
CREATE TABLE IF NOT EXISTS leave_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  description TEXT
);

-- LEAVES Table
CREATE TABLE IF NOT EXISTS leaves (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  leave_type_id    INT NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  total_days       INT NOT NULL,
  reason           TEXT,
  status           ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  manager_comment  TEXT,
  applied_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
);

-- LEAVE_BALANCE Table
CREATE TABLE IF NOT EXISTS leave_balance (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  leave_type_id    INT NOT NULL,
  total_leaves     INT NOT NULL DEFAULT 0,
  used_leaves      INT NOT NULL DEFAULT 0,
  remaining_leaves INT GENERATED ALWAYS AS (total_leaves - used_leaves) STORED,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
);

-- LEAVE_LOGS Table
CREATE TABLE IF NOT EXISTS leave_logs (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  leave_id  INT NOT NULL,
  action    ENUM('applied', 'approved', 'rejected', 'cancelled') NOT NULL,
  action_by INT NOT NULL,
  action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comment   TEXT,
  FOREIGN KEY (leave_id) REFERENCES leaves(id),
  FOREIGN KEY (action_by) REFERENCES users(id)
);

-- NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- LEAVE_ATTACHMENTS Table
CREATE TABLE IF NOT EXISTS leave_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  leave_id    INT NOT NULL,
  file_url    VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_id) REFERENCES leaves(id)
);

-- Insert leave types
INSERT IGNORE INTO leave_types (id, name, description) VALUES
(1, 'Annual Leave', 'Yearly paid leave'),
(2, 'Sick Leave', 'Medical/health related leave'),
(3, 'Casual Leave', 'Short personal leave'),
(4, 'Unpaid Leave', 'Leave without pay');

-- Insert admin user (password: admin123)
-- The password hash here is for 'admin123' using bcrypt with 10 rounds
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'Admin User', 'admin@elms.com', '$2b$10$Q8s7A3z3uR3q/yT0A3JjV.91.xZ/HkU9D.xH6.V.k88z2qQ.7b.3O', 'admin');

-- Insert manager
INSERT IGNORE INTO users (id, name, email, password, role, manager_id) VALUES
(2, 'Sara Khan', 'sara@elms.com', '$2b$10$Q8s7A3z3uR3q/yT0A3JjV.91.xZ/HkU9D.xH6.V.k88z2qQ.7b.3O', 'manager', 1);

-- Insert employee under Sara
INSERT IGNORE INTO users (id, name, email, password, role, manager_id) VALUES
(3, 'Abdul Raheem', 'raheem@elms.com', '$2b$10$Q8s7A3z3uR3q/yT0A3JjV.91.xZ/HkU9D.xH6.V.k88z2qQ.7b.3O', 'employee', 2);
