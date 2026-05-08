const express = require("express");
const router = express.Router();
const db = require("../db/connection");

const promiseDb = db.promise();

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function pad(num) {
    return String(num).padStart(2, "0");
}

function formatDateTime(date) {
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

function formatDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatMonth(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function toNumberOrNull(value) {
    return value === null || value === undefined ? null : Number(value);
}

function normalizeSensorRow(row) {
    if (!row) return null;

    return {
        id: row.id,
        pot_id: row.pot_id,
        temperature: toNumberOrNull(row.temperature),
        humidity: toNumberOrNull(row.humidity),
        soil_moisture: toNumberOrNull(row.soil_moisture),
        light: toNumberOrNull(row.light),
        created_at: row.created_at,
    };
}

function normalizeAverageRow(row) {
    return {
        temperature: toNumberOrNull(row.temperature),
        humidity: toNumberOrNull(row.humidity),
        soil_moisture: toNumberOrNull(row.soil_moisture),
        light: toNumberOrNull(row.light),
    };
}

async function ensurePotExists(potId) {
    const [pots] = await promiseDb.query(
        "SELECT id FROM pot WHERE id = ?",
        [potId]
    );

    return pots.length > 0;
}

function getChartConfig(unit) {
    const now = new Date();

    if (unit === "hour") {
        const endAnchor = new Date(now);
        endAnchor.setMinutes(0, 0, 0);

        const start = new Date(endAnchor);
        start.setHours(start.getHours() - 23);

        const end = new Date(endAnchor);
        end.setHours(end.getHours() + 1);

        const buckets = Array.from({ length: 24 }, (_, index) => {
            const bucketDate = new Date(start);
            bucketDate.setHours(bucketDate.getHours() + index);

            return {
                bucket: formatDateTime(bucketDate),
                label: `${pad(bucketDate.getHours())}:00`,
            };
        });

        return {
            start,
            end,
            buckets,
            bucketSql: "DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')",
        };
    }

    if (unit === "day") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const start = new Date(today);
        start.setDate(start.getDate() - 29);

        const end = new Date(today);
        end.setDate(end.getDate() + 1);

        const buckets = Array.from({ length: 30 }, (_, index) => {
            const bucketDate = new Date(start);
            bucketDate.setDate(bucketDate.getDate() + index);

            return {
                bucket: formatDate(bucketDate),
                label: formatDate(bucketDate),
            };
        });

        return {
            start,
            end,
            buckets,
            bucketSql: "DATE_FORMAT(created_at, '%Y-%m-%d')",
        };
    }

    if (unit === "month") {
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const start = new Date(currentMonth);
        start.setMonth(start.getMonth() - 11);

        const end = new Date(currentMonth);
        end.setMonth(end.getMonth() + 1);

        const buckets = Array.from({ length: 12 }, (_, index) => {
            const bucketDate = new Date(start);
            bucketDate.setMonth(bucketDate.getMonth() + index);

            return {
                bucket: formatMonth(bucketDate),
                label: formatMonth(bucketDate),
            };
        });

        return {
            start,
            end,
            buckets,
            bucketSql: "DATE_FORMAT(created_at, '%Y-%m')",
        };
    }

    return null;
}

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

/**
 * 화분 최신 센서 데이터 조회 API
 * GET /api/sensor-data/latest/:potId
 */
router.get("/latest/:potId", async (req, res) => {
    try {
        const potId = Number(req.params.potId);

        if (!isPositiveInteger(potId)) {
            return res.status(400).json({
                success: false,
                message: "pot_id는 1 이상의 정수여야 합니다.",
            });
        }

        const potExists = await ensurePotExists(potId);

        if (!potExists) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 화분입니다.",
            });
        }

        const [sensorData] = await promiseDb.query(
            `
            SELECT
                id,
                pot_id,
                temperature,
                humidity,
                soil_moisture,
                light,
                created_at
            FROM sensor_data
            WHERE pot_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            `,
            [potId]
        );

        res.json({
            success: true,
            data: normalizeSensorRow(sensorData[0]),
        });
    } catch (error) {
        console.error("최신 센서 데이터 조회 오류:", error);
        res.status(500).json({
            success: false,
            message: "최신 센서 데이터 조회 실패",
            error: error.message,
        });
    }
});

/**
 * 센서 데이터 분석 차트 조회 API
 * GET /api/sensor-data/chart/:potId?unit=hour|day|month
 */
router.get("/chart/:potId", async (req, res) => {
    try {
        const potId = Number(req.params.potId);
        const unit = req.query.unit || "hour";

        if (!isPositiveInteger(potId)) {
            return res.status(400).json({
                success: false,
                message: "pot_id는 1 이상의 정수여야 합니다.",
            });
        }

        const config = getChartConfig(unit);

        if (!config) {
            return res.status(400).json({
                success: false,
                message: "unit은 hour, day, month 중 하나여야 합니다.",
            });
        }

        const potExists = await ensurePotExists(potId);

        if (!potExists) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 화분입니다.",
            });
        }

        const [averages] = await promiseDb.query(
            `
            SELECT
                ${config.bucketSql} AS bucket,
                AVG(temperature) AS temperature,
                AVG(humidity) AS humidity,
                AVG(soil_moisture) AS soil_moisture,
                AVG(light) AS light
            FROM sensor_data
            WHERE pot_id = ?
              AND created_at >= ?
              AND created_at < ?
            GROUP BY bucket
            ORDER BY bucket ASC
            `,
            [potId, formatDateTime(config.start), formatDateTime(config.end)]
        );

        const averageMap = new Map(
            averages.map((row) => [row.bucket, normalizeAverageRow(row)])
        );

        const data = config.buckets.map(({ bucket, label }) => ({
            bucket,
            label,
            ...(averageMap.get(bucket) || {
                temperature: null,
                humidity: null,
                soil_moisture: null,
                light: null,
            }),
        }));

        res.json({
            success: true,
            data: {
                pot_id: potId,
                unit,
                start_at: formatDateTime(config.start),
                end_at: formatDateTime(config.end),
                count: data.length,
                items: data,
            },
        });
    } catch (error) {
        console.error("센서 데이터 차트 조회 오류:", error);
        res.status(500).json({
            success: false,
            message: "센서 데이터 차트 조회 실패",
            error: error.message,
        });
    }
});

module.exports = router;
