const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const {
    formatKstDateTime,
    getKstNowDate,
} = require("../utils/kstDate");
// [알림 통합-효성] 자동/예약 급수 시 알림 발송 모듈
const { sendWateringNotification } = require("../services/wateringNotification");

const promiseDb = db.promise();

/**
 * true/false 값을 MySQL TINYINT(1) 값으로 변환
 */
function toTinyInt(value) {
    return value === true || value === 1 || value === "1" || value === "true"
        ? 1
        : 0;
}

/**
 * duration_ms 또는 duration_sec 둘 다 받을 수 있게 처리
 */
function getDurationMs(body, defaultValue = 15000) {
    if (body.duration_ms !== undefined && body.duration_ms !== null) {
        return Number(body.duration_ms);
    }

    if (body.duration_sec !== undefined && body.duration_sec !== null) {
        return Number(body.duration_sec) * 1000;
    }

    return defaultValue;
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function normalizeTime(value) {
    if (!value) return "08:00:00";

    // "08:00" 형태로 오면 "08:00:00"으로 변환
    if (/^\d{2}:\d{2}$/.test(value)) {
        return `${value}:00`;
    }

    return value;
}

function pad(num) {
    return String(num).padStart(2, "0");
}

function formatKstBaseDateTime(date) {
    return (
        `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
        `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
    );
}

function normalizeWateringSetting(setting) {
    return {
        ...setting,
        auto_enabled: Boolean(setting.auto_enabled),
        schedule_enabled: Boolean(setting.schedule_enabled),
        last_watered_at: formatKstDateTime(setting.last_watered_at),
        next_water_at: formatKstDateTime(setting.next_water_at),
        timezone: "Asia/Seoul",
    };
}

/**
 * 예약 급수 다음 실행 시간 계산
 */
function calculateNextWaterAt(wateringTime, intervalValue, intervalUnit) {
    const [hour, minute, second] = wateringTime.split(":").map(Number);
    const now = getKstNowDate();

    const next = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        hour || 0,
        minute || 0,
        second || 0,
        0
    ));

    if (next <= now) {
        if (intervalUnit === "WEEK") {
            next.setUTCDate(next.getUTCDate() + intervalValue * 7);
        } else {
            next.setUTCDate(next.getUTCDate() + intervalValue);
        }
    }

    return formatKstBaseDateTime(next);
}

/**
 * 급수 설정 조회 API
 * GET /api/watering/settings/:potId
 */
router.get("/settings/:potId", async (req, res) => {
    try {
        const potId = Number(req.params.potId);

        const [pots] = await promiseDb.query(
            "SELECT id FROM pot WHERE id = ?",
            [potId]
        );

        if (pots.length === 0) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 화분입니다.",
            });
        }

        const [settings] = await promiseDb.query(
            `
            SELECT
                pot_id,
                auto_enabled,
                schedule_enabled,
                min_soil_moisture,
                interval_value,
                interval_unit,
                watering_time,
                duration_ms,
                last_watered_at,
                next_water_at
            FROM watering_settings
            WHERE pot_id = ?
            `,
            [potId]
        );

        // 아직 설정값이 없는 경우 기본값 반환
        if (settings.length === 0) {
            return res.json({
                success: true,
                data: {
                    pot_id: potId,
                    auto_enabled: false,
                    schedule_enabled: false,
                    min_soil_moisture: 30,
                    interval_value: 1,
                    interval_unit: "DAY",
                    watering_time: "08:00:00",
                    duration_ms: 15000,
                    last_watered_at: null,
                    next_water_at: null,
                    timezone: "Asia/Seoul",
                },
            });
        }

        const setting = settings[0];

        res.json({
            success: true,
            data: normalizeWateringSetting(setting),
        });
    } catch (error) {
        console.error("급수 설정 조회 오류:", error);
        res.status(500).json({
            success: false,
            message: "급수 설정 조회 실패",
            error: error.message,
        });
    }
});

/**
 * 급수 설정 저장 API
 * POST /api/watering/settings/:potId
 */
router.post("/settings/:potId", async (req, res) => {
    try {
        const potId = Number(req.params.potId);

        const [pots] = await promiseDb.query(
            "SELECT id FROM pot WHERE id = ?",
            [potId]
        );

        if (pots.length === 0) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 화분입니다.",
            });
        }

        const autoEnabled = toTinyInt(req.body.auto_enabled);
        const scheduleEnabled = toTinyInt(req.body.schedule_enabled);

        const minSoilMoisture =
            req.body.min_soil_moisture !== undefined &&
                req.body.min_soil_moisture !== null
                ? Number(req.body.min_soil_moisture)
                : 30;

        const intervalValue =
            req.body.interval_value !== undefined &&
                req.body.interval_value !== null
                ? Number(req.body.interval_value)
                : 1;

        const intervalUnit = req.body.interval_unit || "DAY";
        const wateringTime = normalizeTime(req.body.watering_time);
        const durationMs = getDurationMs(req.body, 15000);

        if (!["DAY", "WEEK"].includes(intervalUnit)) {
            return res.status(400).json({
                success: false,
                message: "interval_unit은 DAY 또는 WEEK만 가능합니다.",
            });
        }

        if (durationMs <= 0) {
            return res.status(400).json({
                success: false,
                message: "1회 급수량은 0보다 커야 합니다.",
            });
        }

        const nextWaterAt = scheduleEnabled
            ? calculateNextWaterAt(wateringTime, intervalValue, intervalUnit)
            : null;

        await promiseDb.query(
            `
            INSERT INTO watering_settings (
                pot_id,
                auto_enabled,
                schedule_enabled,
                min_soil_moisture,
                interval_value,
                interval_unit,
                watering_time,
                duration_ms,
                next_water_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                auto_enabled = VALUES(auto_enabled),
                schedule_enabled = VALUES(schedule_enabled),
                min_soil_moisture = VALUES(min_soil_moisture),
                interval_value = VALUES(interval_value),
                interval_unit = VALUES(interval_unit),
                watering_time = VALUES(watering_time),
                duration_ms = VALUES(duration_ms),
                next_water_at = VALUES(next_water_at),
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                potId,
                autoEnabled,
                scheduleEnabled,
                minSoilMoisture,
                intervalValue,
                intervalUnit,
                wateringTime,
                durationMs,
                nextWaterAt,
            ]
        );

        res.json({
            success: true,
            message: "급수 설정 저장 완료",
            data: {
                pot_id: potId,
                auto_enabled: Boolean(autoEnabled),
                schedule_enabled: Boolean(scheduleEnabled),
                min_soil_moisture: minSoilMoisture,
                interval_value: intervalValue,
                interval_unit: intervalUnit,
                watering_time: wateringTime,
                duration_ms: durationMs,
                next_water_at: nextWaterAt,
                timezone: "Asia/Seoul",
            },
        });
    } catch (error) {
        console.error("급수 설정 저장 오류:", error);
        res.status(500).json({
            success: false,
            message: "급수 설정 저장 실패",
            error: error.message,
        });
    }
});

/**
 * 수동 급수 명령 생성 API
 * POST /api/watering/manual/:potId
 */
router.post("/manual/:potId", async (req, res) => {
    try {
        const potId = Number(req.params.potId);

        const [pots] = await promiseDb.query(
            "SELECT id FROM pot WHERE id = ?",
            [potId]
        );

        if (pots.length === 0) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 화분입니다.",
            });
        }

        const [settings] = await promiseDb.query(
            `
            SELECT duration_ms
            FROM watering_settings
            WHERE pot_id = ?
            `,
            [potId]
        );

        const defaultDurationMs =
            settings.length > 0 ? settings[0].duration_ms : 15000;

        const durationMs = getDurationMs(req.body, defaultDurationMs);

        const [result] = await promiseDb.query(
            `
            INSERT INTO watering_commands (
                pot_id,
                command,
                command_type,
                duration_ms,
                status,
                scheduled_at,
                expires_at
            )
            VALUES (
                ?,
                'WATER',
                'MANUAL',
                ?,
                'PENDING',
                NOW(),
                DATE_ADD(NOW(), INTERVAL 1 MINUTE)
            )
            `,
            [potId, durationMs]
        );

        res.json({
            success: true,
            message: "수동 급수 명령 생성 완료",
            data: {
                command_id: result.insertId,
                pot_id: potId,
                command: "WATER",
                command_type: "MANUAL",
                duration_ms: durationMs,
            },
        });
    } catch (error) {
        console.error("수동 급수 명령 생성 오류:", error);
        res.status(500).json({
            success: false,
            message: "수동 급수 명령 생성 실패",
            error: error.message,
        });
    }
});

/**
 * ESP32 명령 조회 API
 * GET /api/watering/device/command?device_id=pot_001
 */
router.get("/device/command", async (req, res) => {
    try {
        const { device_id } = req.query;

        if (!device_id) {
            return res.status(400).json({
                success: false,
                command: "NONE",
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
                command: "NONE",
                message: "등록되지 않은 device_id입니다.",
            });
        }

        const potId = pots[0].id;

        // 만료된 수동 명령 처리
        await promiseDb.query(
            `
            UPDATE watering_commands
            SET status = 'EXPIRED'
            WHERE pot_id = ?
              AND status = 'PENDING'
              AND expires_at IS NOT NULL
              AND expires_at <= NOW()
            `,
            [potId]
        );

        const [commands] = await promiseDb.query(
            `
            SELECT
                id,
                pot_id,
                command,
                command_type,
                duration_ms
            FROM watering_commands
            WHERE pot_id = ?
              AND status = 'PENDING'
              AND (scheduled_at IS NULL OR scheduled_at <= NOW())
              AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY created_at ASC
            LIMIT 1
            `,
            [potId]
        );

        if (commands.length === 0) {
            return res.json({
                success: true,
                command: "NONE",
            });
        }

        const command = commands[0];

        const [updateResult] = await promiseDb.query(
            `
            UPDATE watering_commands
            SET status = 'RUNNING',
                claimed_at = NOW()
            WHERE id = ?
              AND status = 'PENDING'
            `,
            [command.id]
        );

        if (updateResult.affectedRows === 0) {
            return res.json({
                success: true,
                command: "NONE",
                message: "이미 처리된 명령입니다.",
            });
        }

        res.json({
            success: true,
            command_id: command.id,
            pot_id: command.pot_id,
            command: command.command,
            command_type: command.command_type,
            duration_ms: command.duration_ms,
        });
    } catch (error) {
        console.error("ESP32 명령 조회 오류:", error);
        res.status(500).json({
            success: false,
            command: "NONE",
            message: "ESP32 명령 조회 실패",
            error: error.message,
        });
    }
});

/**
 * ESP32 급수 실행 결과 저장 API
 * POST /api/watering/device/command/result
 */
router.post("/device/command/result", async (req, res) => {
    try {
        const {
            device_id,
            command_id,
            success,
            message,
        } = req.body;

        if (!device_id || !command_id) {
            return res.status(400).json({
                success: false,
                message: "device_id와 command_id는 필수입니다.",
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

        const [commands] = await promiseDb.query(
            `
            SELECT
                id,
                pot_id,
                command_type,
                duration_ms
            FROM watering_commands
            WHERE id = ?
              AND pot_id = ?
            `,
            [command_id, potId]
        );

        if (commands.length === 0) {
            return res.status(404).json({
                success: false,
                message: "해당 급수 명령을 찾을 수 없습니다.",
            });
        }

        const command = commands[0];

        const isSuccess =
            success === true || success === 1 || success === "1" || success === "true";

        const finalStatus = isSuccess ? "DONE" : "FAILED";

        await promiseDb.query(
            `
            UPDATE watering_commands
            SET status = ?,
                executed_at = NOW()
            WHERE id = ?
            `,
            [finalStatus, command_id]
        );

        await promiseDb.query(
            `
            INSERT INTO watering_logs (
                pot_id,
                command_id,
                command_type,
                duration_ms,
                success,
                message
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                potId,
                command.id,
                command.command_type,
                command.duration_ms,
                isSuccess ? 1 : 0,
                message || (isSuccess ? "급수 완료" : "급수 실패"),
            ]
        );

        if (isSuccess) {
            await promiseDb.query(
                `
                UPDATE watering_settings
                SET last_watered_at = NOW()
                WHERE pot_id = ?
                `,
                [potId]
            );
        }
        // [알림통합-효성] 자동/예약 급수 알림 발송 (MANUAL은 함수 내부에서 스킵)
        // 실패해도 catch되니 응답에 영향 없음
        await sendWateringNotification(potId, command.command_type, isSuccess, message);

        res.json({
            success: true,
            message: "급수 실행 결과 저장 완료",
        });
    } catch (error) {
        console.error("급수 실행 결과 저장 오류:", error);
        res.status(500).json({
            success: false,
            message: "급수 실행 결과 저장 실패",
            error: error.message,
        });
    }
});

/**
 * 급수 로그 조회 API
 * GET /api/watering/logs/:potId?limit=50
 */
router.get("/logs/:potId", async (req, res) => {
    try {
        const potId = Number(req.params.potId);
        const requestedLimit = Number(req.query.limit || 50);
        const limit = Number.isInteger(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 100)
            : 50;

        if (!isPositiveInteger(potId)) {
            return res.status(400).json({
                success: false,
                message: "pot_id는 1 이상의 정수여야 합니다.",
            });
        }

        const [pots] = await promiseDb.query(
            "SELECT id FROM pot WHERE id = ?",
            [potId]
        );

        if (pots.length === 0) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 화분입니다.",
            });
        }

        const [logs] = await promiseDb.query(
            `
            SELECT
                pot_id,
                command_id,
                command_type,
                duration_ms,
                success,
                message,
                created_at
            FROM watering_logs
            WHERE pot_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            `,
            [potId, limit]
        );

        res.json({
            success: true,
            data: {
                pot_id: potId,
                count: logs.length,
                items: logs.map((log) => ({
                    ...log,
                    success: Boolean(log.success),
                    created_at: formatKstDateTime(log.created_at),
                })),
                timezone: "Asia/Seoul",
            },
        });
    } catch (error) {
        console.error("급수 로그 조회 오류:", error);
        res.status(500).json({
            success: false,
            message: "급수 로그 조회 실패",
            error: error.message,
        });
    }
});

module.exports = router;
