const db = require('../config/db');
const logger = require('../middleware/logger');

const AppointmentModel = {
  async create({ studentId, reasonCategory, requestedTime, status = 'pending' }) {
    const [result] = await db.execute(
      `INSERT INTO appointments (student_id, reason_category, requested_time, status)
       VALUES (?, ?, ?, ?)`,
      [studentId, reasonCategory, requestedTime, status]
    );
    logger.info('Appointment created', { appointmentId: result.insertId, studentId });
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByStudentId(studentId) {
    const [rows] = await db.execute(
      'SELECT * FROM appointments WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
    return rows;
  },

  async findAll({ status, limit = 50, offset = 0 } = {}) {
    let query = 'SELECT * FROM appointments';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await db.execute(query, params);
    return rows;
  },

  async updateStatus(id, status, lastError = null) {
    await db.execute(
      'UPDATE appointments SET status = ?, last_error = ?, retry_count = retry_count + 1 WHERE id = ?',
      [status, lastError, id]
    );
    logger.info('Appointment status updated', { appointmentId: id, status });
  },

  async update(id, fields) {
    const setClauses = [];
    const values = [];
    
    for (const [key, value] of Object.entries(fields)) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
    
    values.push(id);
    await db.execute(
      `UPDATE appointments SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  },

  async recordAudit({ userId, action, resourceType, resourceId, details }) {
    await db.execute(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, resourceType, resourceId, JSON.stringify(details)]
    );
  },
};

module.exports = AppointmentModel;