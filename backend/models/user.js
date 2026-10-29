const db = require('../config/db');
const logger = require('../middleware/logger');

const UserModel = {
  async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT id, username, password_hash, role, student_id FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, role, student_id FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async create({ username, passwordHash, role, studentId }) {
    const [result] = await db.execute(
      'INSERT INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
      [username, passwordHash, role, studentId || null]
    );
    logger.info('User created', { userId: result.insertId, role });
    return result.insertId;
  },
};

module.exports = UserModel;