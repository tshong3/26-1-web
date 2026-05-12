const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authMiddleware = require("../middleware/authMiddleware");

const promiseDb = db.promise();

// 식물 도감 리스트 조회
router.get("/guide", async (req, res) => {
    try {
        const [results] = await promiseDb.query(
            "SELECT * FROM plant_guide ORDER BY name ASC"
        );
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("도감 조회 오류:", error);
        res.status(500).json({ success: false, message: "도감 조회 실패", error: error.message });
    }
});

// 내 화분 등록
router.post("/register", authMiddleware, async (req, res) => {
    try {
        const { plant_id, pot_id, nickname } = req.body;
        const user_id = req.user.id;

        const [result] = await promiseDb.query(
            `UPDATE pot 
            SET plant_id = ?, 
                nickname = ?, 
                user_id = ? 
            WHERE id = ?`,
            [plant_id, nickname, user_id, pot_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "해당 화분(기기)을 찾을 수 없습니다." });
        }

        res.status(200).json({ 
            success: true,
            message: "내 화분 등록 완료! AI가 식물 상태 분석을 시작합니다."
        });
    } catch (error) {
        console.error("화분 등록 오류:", error);
        res.status(500).json({ success: false, message: "화분 등록 실패", error: error.message });
    }
});

// 내 화분 목록 조회
router.get("/pots", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;

        const [pots] = await promiseDb.query(
            `SELECT 
                pot.id,
                pot.pot_name,
                pot.nickname,
                pot.device_id,
                pot.last_ai_comment,
                pot.created_at,
                plant_guide.id AS plant_id,
                plant_guide.name AS plant_name,
                plant_guide.soil_moisture_min,
                plant_guide.soil_moisture_max,
                plant_guide.temperature_min,
                plant_guide.temperature_max,
                plant_guide.humidity_min,
                plant_guide.humidity_max,
                plant_guide.light_min,
                plant_guide.light_max,
                plant_guide.recommend_water_level
            FROM pot
            LEFT JOIN plant_guide ON pot.plant_id = plant_guide.id
            WHERE pot.user_id = ?
            ORDER BY pot.created_at DESC`,
            [user_id]
        );

        res.json({ success: true, data: pots });
    } catch (error) {
        console.error("화분 목록 조회 오류:", error);
        res.status(500).json({ success: false, message: "화분 목록 조회 실패", error: error.message });
    }
});

// 화분 상세 조회
router.get("/pots/:potId", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const potId = Number(req.params.potId);

        const [pots] = await promiseDb.query(
            `SELECT 
                pot.id,
                pot.pot_name,
                pot.nickname,
                pot.device_id,
                pot.last_ai_comment,
                pot.created_at,
                plant_guide.id AS plant_id,
                plant_guide.name AS plant_name,
                plant_guide.soil_moisture_min,
                plant_guide.soil_moisture_max,
                plant_guide.temperature_min,
                plant_guide.temperature_max,
                plant_guide.humidity_min,
                plant_guide.humidity_max,
                plant_guide.light_min,
                plant_guide.light_max,
                plant_guide.recommend_water_level
            FROM pot
            LEFT JOIN plant_guide ON pot.plant_id = plant_guide.id
            WHERE pot.id = ? AND pot.user_id = ?`,
            [potId, user_id]
        );

        if (pots.length === 0) {
            return res.status(404).json({ success: false, message: "화분을 찾을 수 없습니다." });
        }

        res.json({ success: true, data: pots[0] });
    } catch (error) {
        console.error("화분 상세 조회 오류:", error);
        res.status(500).json({ success: false, message: "화분 상세 조회 실패", error: error.message });
    }
});

// 화분 수정
router.put("/pots/:potId", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const potId = Number(req.params.potId);
        const { pot_name, nickname, plant_id } = req.body;

        const [result] = await promiseDb.query(
            `UPDATE pot 
            SET pot_name = COALESCE(?, pot_name),
                nickname = COALESCE(?, nickname),
                plant_id = COALESCE(?, plant_id)
            WHERE id = ? AND user_id = ?`,
            [
                pot_name ?? null,
                nickname ?? null,
                plant_id ?? null,
                potId,
                user_id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "화분을 찾을 수 없습니다." });
        }

        res.json({ success: true, message: "화분 수정 완료" });
    } catch (error) {
        console.error("화분 수정 오류:", error);
        res.status(500).json({ success: false, message: "화분 수정 실패", error: error.message });
    }
});

// 화분 삭제
router.delete("/pots/:potId", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const potId = Number(req.params.potId);

        const [result] = await promiseDb.query(
            "DELETE FROM pot WHERE id = ? AND user_id = ?",
            [potId, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "화분을 찾을 수 없습니다." });
        }

        res.json({ success: true, message: "화분 삭제 완료" });
    } catch (error) {
        console.error("화분 삭제 오류:", error);
        res.status(500).json({ success: false, message: "화분 삭제 실패", error: error.message });
    }
});

module.exports = router;