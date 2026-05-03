const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");
require("dotenv").config();

// 회원가입
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(sql, [username, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ message: "회원가입 실패", error: err });
      res.status(201).json({ message: "회원가입 성공" });
    });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// 로그인
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류" });
    if (results.length === 0) return res.status(401).json({ message: "이메일 또는 비밀번호가 틀렸습니다." });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "이메일 또는 비밀번호가 틀렸습니다." });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "로그인 성공", token });
  });
});

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post("/logout", (req, res) => {
  res.json({ message: "로그아웃 성공" });
});

module.exports = router;