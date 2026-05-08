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

    // 1. 선택한 식물의 기본 가이드 정보 가져오기 (plant_guide)
    const sqlMaster = "SELECT recommend_moisture FROM plant_guide WHERE id = ?";
    db.query(sqlMaster, [plant_id], (err, masterResults) => {
        if (err || masterResults.length === 0) {
            return res.status(400).json({ message: "식물 정보가 없습니다." });
        }

        // 가이드에 있는 기본 권장 습도를 가져오기
        const defaultTargetMoisture = masterResults[0].recommend_moisture;

        const sqlUpdatePot = `
            UPDATE pot 
            SET plant_id = ?, 
                nickname = ?, 
                target_moisture_min = ?, 
                user_id = ? 
            WHERE id = ?
        `;

        db.query(sqlUpdatePot, [plant_id, nickname, defaultTargetMoisture, user_id, pot_id], (err, result) => {
            if (err) return res.status(500).json({ message: "화분 정보 업데이트 실패", error: err });
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "해당 화분(기기)을 찾을 수 없습니다." });
            }

            /* 
               여기에 AI API를 비동기로 호출해서 
               위에서 넣은 defaultTargetMoisture를 AI가 추천하는 
               정밀한 값으로 다시 한 번 UPDATE 치는 로직을 추가
            */

            res.status(200).json({ 
                message: "내 화분 등록 완료! AI가 식물 상태 분석을 시작합니다.",
                targetMoisture: defaultTargetMoisture 
            });
        });
    });
});

module.exports = router;