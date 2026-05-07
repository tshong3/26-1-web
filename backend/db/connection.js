const mysql = require("mysql2");
const path = require("path");
// 현재 파일 위치와 상관없이 'backend' 폴더 안의 .env를 찾도록 경로 고정
require("dotenv").config({ path: path.join(__dirname, "../.env") });

console.log("체크 - DB_USER:", process.env.DB_USER); // 서버 실행 시 터미널에 root가 찍혀야 함

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = db;