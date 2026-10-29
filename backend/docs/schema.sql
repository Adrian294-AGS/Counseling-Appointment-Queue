-- Counseling Appointment Queue Database Schema
-- Run this script to initialize the MySQL database

CREATE DATABASE IF NOT EXISTS counseling_queue;
USE counseling_queue;

-- Users table: stores students, counselors, and intake staff
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'counselor', 'intake_staff') NOT NULL,
  student_id VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointments table: tracks all appointment requests and their lifecycle
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  reason_category ENUM('Academic', 'Personal', 'Career') NOT NULL,
  requested_time DATETIME NOT NULL,
  status ENUM(
    'pending',
    'confirmed',
    'rescheduled',
    'cancelled',
    'transient_failure',
    'permanent_failure_manual_review'
  ) DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  last_error TEXT,
  counselor_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (counselor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  INDEX idx_requested_time (requested_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit logs table: records all state changes for accountability
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: For development, you'll need to hash passwords before inserting.
-- Use bcrypt to hash 'password123' and replace the placeholder hashes below.
-- Example: $2b$10$YourHashedPasswordHere