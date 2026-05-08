const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const {
    formatKstDateTime,
    getKstNowDate,
    pad,
} = require("../utils/kstDate");

const promiseDb = db.promise();

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function formatKstBaseDateTime(date) {
    return (
        `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
        `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
    );
}

function formatKstBaseDate(date) {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function formatKstBaseMonth(date) {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
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
        created_at: formatKstDateTime(row.created_at),
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
    const now = getKstNowDate();

    if (unit === "hour") {
        const endAnchor = new Date(now);
        endAnchor.setUTCMinutes(0, 0, 0);

        const start = new Date(endAnchor);
        start.setUTCHours(start.getUTCHours() - 23);

        const end = new Date(endAnchor);
        end.setUTCHours(end.getUTCHours() + 1);

        const buckets = Array.from({ length: 24 }, (_, index) => {
            const bucketDate = new Date(start);
            bucketDate.setUTCHours(bucketDate.getUTCHours() + index);

            return {
                bucket: formatKstBaseDateTime(bucketDate),
                label: `${pad(bucketDate.getUTCHours())}:00`,
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
        const today = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));
        const start = new Date(today);
        start.setUTCDate(start.getUTCDate() - 29);

        const end = new Date(today);
        end.setUTCDate(end.getUTCDate() + 1);

        const buckets = Array.from({ length: 30 }, (_, index) => {
            const bucketDate = new Date(start);
            bucketDate.setUTCDate(bucketDate.getUTCDate() + index);

            return {
                bucket: formatKstBaseDate(bucketDate),
                label: formatKstBaseDate(bucketDate),
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
        const currentMonth = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1
        ));
        const start = new Date(currentMonth);
        start.setUTCMonth(start.getUTCMonth() - 11);

        const end = new Date(currentMonth);
        end.setUTCMonth(end.getUTCMonth() + 1);

        const buckets = Array.from({ length: 12 }, (_, index) => {
            const bucketDate = new Date(start);
            bucketDate.setUTCMonth(bucketDate.getUTCMonth() + index);

            return {
                bucket: formatKstBaseMonth(bucketDate),
                label: formatKstBaseMonth(bucketDate),
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
            [potId, formatKstBaseDateTime(config.start), formatKstBaseDateTime(config.end)]
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
                start_at: formatKstBaseDateTime(config.start),
                end_at: formatKstBaseDateTime(config.end),
                timezone: "Asia/Seoul",
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
