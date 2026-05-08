const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authMiddleware = require("../middleware/authMiddleware");

// 모든 알림 API는 로그인 필수
router.use(authMiddleware);

// 알림 목록 조회 (페이지네이션 지원)
// GET /api/notifications?limit=20&cursor=123&unread=true
router.get("/", (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
  const unreadOnly = req.query.unread === "true";

  let sql = "SELECT id, pot_id, type, severity, message, is_read, created_at FROM notifications WHERE user_id = ?";
  const params = [userId];

  if (unreadOnly) {
    sql += " AND is_read = 0";
  }
  if (cursor) {
    sql += " AND id < ?";
    params.push(cursor);
  }

  sql += " ORDER BY id DESC LIMIT ?";
  params.push(limit);

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: "알림 조회 실패", error: err });

    const nextCursor = results.length === limit ? results[results.length - 1].id : null;
    res.json({
      notifications: results,
      nextCursor,
    });
  });
});

// 안읽은 알림 개수 (벨 아이콘 배지용)
// GET /api/notifications/unread-count
router.get("/unread-count", (req, res) => {
  const userId = req.user.id;
  const sql = "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0";

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "조회 실패", error: err });
    res.json({ count: results[0].count });
  });
});

// 전체 읽음 처리
// PATCH /api/notifications/read-all
router.patch("/read-all", (req, res) => {
  const userId = req.user.id;
  const sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0";

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ message: "읽음 처리 실패", error: err });
    res.json({ message: "전체 읽음 처리 완료", updated: result.affectedRows });
  });
});

// 개별 알림 읽음 처리 (본인 알림만 가능)
// PATCH /api/notifications/:id/read
router.patch("/:id/read", (req, res) => {
  const userId = req.user.id;
  const notificationId = parseInt(req.params.id);

  if (isNaN(notificationId)) {
    return res.status(400).json({ message: "잘못된 알림 ID입니다." });
  }

  const sql = "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?";
  db.query(sql, [notificationId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "읽음 처리 실패", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "알림을 찾을 수 없거나 권한이 없습니다." });
    }
    res.json({ message: "읽음 처리 완료" });
  });
});

module.exports = router;
