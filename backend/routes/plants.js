const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authMiddleware = require("../middleware/authMiddleware");

// 식물 도감 리스트 조회
router.get("/guide", (req, res) => {
    const sql = "SELECT * FROM plant_guide ORDER BY name ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "도감 조회 실패", error: err });
        res.json(results);
    });
});

// 내 화분 등록
router.post("/register", authMiddleware, (req, res) => {
    const { plant_id, pot_id, nickname } = req.body;
    const user_id = req.user.id;

    // 선택한 식물의 기준 수분 정보 가져오기
    const sqlMaster = "SELECT recommend_moisture FROM plant_guide WHERE id = ?";
    db.query(sqlMaster, [plant_id], (err, masterResults) => {
        if (err || masterResults.length === 0) {
            return res.status(400).json({ message: "식물 정보가 없습니다." });
        }

        const targetMoisture = masterResults[0].recommend_moisture;

        // user_plants 테이블에 등록
        const sqlInsertUserPlant = "INSERT INTO user_plants (user_id, plant_id, pot_id, nickname) VALUES (?, ?, ?, ?)";
        db.query(sqlInsertUserPlant, [user_id, plant_id, pot_id, nickname], (err) => {
            if (err) return res.status(500).json({ message: "화분 등록 실패", error: err });

            // watering_settings 테이블 자동 연동
            const sqlUpdateWatering = `
                INSERT INTO watering_settings (pot_id, min_soil_moisture, auto_enabled) 
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE min_soil_moisture = ?`;

            db.query(sqlUpdateWatering, [pot_id, targetMoisture, targetMoisture], (err) => {
                if (err) return res.status(500).json({ message: "급수 설정 연동 실패", error: err });
                res.status(201).json({ message: "내 화분 등록 및 자동 급수 설정 완료" });
            });
        });
    });
});

module.exports = router;