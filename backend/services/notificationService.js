const db = require("../db/connection");

/**
 * 알림 생성
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.potId
 * @param {string} params.type - 'temperature' | 'humidity' | 'soil_moisture' | 'light' | 'system'
 * @param {string} params.severity - 'info' | 'warning' | 'critical'
 * @param {string} params.message
 * @returns {Promise<{id: number}>}
 */
function createNotification({ userId, potId, type, severity = "warning", message }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO notifications (user_id, pot_id, type, severity, message)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [userId, potId, type, severity, message], (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId });
    });
  });
}

/**
 * 같은 화분/타입 알림이 최근 N시간 내에 있었는지 체크 (중복 알림 방지)
 * @param {number} potId
 * @param {string} type
 * @param {number} cooldownHours - 쿨다운 시간 (기본 6시간)
 * @returns {Promise<boolean>} - true면 발송 가능, false면 쿨다운 중
 */
function shouldSendNotification(potId, type, cooldownHours = 6) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id FROM notifications
      WHERE pot_id = ? AND type = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
      LIMIT 1
    `;
    db.query(sql, [potId, type, cooldownHours], (err, results) => {
      if (err) return reject(err);
      resolve(results.length === 0); // 최근 알림 없으면 발송 가능
    });
  });
}

module.exports = {
  createNotification,
  shouldSendNotification,
};
