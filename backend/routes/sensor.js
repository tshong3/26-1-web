const express = require("express");
const router = express.Router();
const db = require("../db/connection");

const promiseDb = db.promise();

// ESP32 센서 데이터 저장 API
router.post("/", async (req, res) => {
    try {
        const {
            device_id,
            temperature,
            humidity,
            soil_moisture,
            light,
        } = req.body;

        if (!device_id) {
            return res.status(400).json({
                success: false,
                message: "device_id는 필수입니다.",
            });
        }

        const [pots] = await promiseDb.query(
            "SELECT id FROM pot WHERE device_id = ?",
            [device_id]
        );

        if (pots.length === 0) {
            return res.status(404).json({
                success: false,
                message: "등록되지 않은 device_id입니다.",
            });
        }

        const potId = pots[0].id;

        await promiseDb.query(
            `
      INSERT INTO sensor_data
      (pot_id, temperature, humidity, soil_moisture, light)
      VALUES (?, ?, ?, ?, ?)
      `,
            [
                potId,
                temperature ?? null,
                humidity ?? null,
                soil_moisture ?? null,
                light ?? null,
            ]
        );

        res.json({
            success: true,
            message: "센서 데이터 저장 완료",
        });
    } catch (error) {
        console.error("센서 데이터 저장 오류:", error);
        res.status(500).json({
            success: false,
            message: "센서 데이터 저장 실패",
            error: error.message,
        });
    }
});
module.exports = router;