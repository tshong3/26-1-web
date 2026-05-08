const cron = require("node-cron");
const db = require("../db/connection");

const promiseDb = db.promise();

const AUTO_COOLDOWN_MINUTES = 10;
const COMMAND_EXPIRE_MINUTES = 1;
const SCHEDULER_CRON = "*/30 * * * * *";

let isRunning = false;

async function expirePendingCommands() {
    await promiseDb.query(
        `
        UPDATE watering_commands
        SET status = 'EXPIRED'
        WHERE status = 'PENDING'
          AND expires_at IS NOT NULL
          AND expires_at <= NOW()
        `
    );
}

async function createAutoWateringCommands() {
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
        SELECT
            ws.pot_id,
            'WATER',
            'AUTO',
            ws.duration_ms,
            'PENDING',
            NOW(),
            DATE_ADD(NOW(), INTERVAL ? MINUTE)
        FROM watering_settings ws
        JOIN sensor_data sd
          ON sd.id = (
              SELECT latest.id
              FROM sensor_data latest
              WHERE latest.pot_id = ws.pot_id
              ORDER BY latest.created_at DESC, latest.id DESC
              LIMIT 1
          )
        WHERE ws.auto_enabled = 1
          AND sd.soil_moisture IS NOT NULL
          AND sd.soil_moisture <= ws.min_soil_moisture
          AND (
              ws.last_watered_at IS NULL
              OR ws.last_watered_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
          )
          AND NOT EXISTS (
              SELECT 1
              FROM watering_commands wc
              WHERE wc.pot_id = ws.pot_id
                AND wc.status IN ('PENDING', 'RUNNING')
              LIMIT 1
          )
        `,
        [COMMAND_EXPIRE_MINUTES, AUTO_COOLDOWN_MINUTES]
    );

    return result.affectedRows || 0;
}

async function getDueScheduleSettings() {
    const [settings] = await promiseDb.query(
        `
        SELECT
            ws.pot_id,
            ws.duration_ms,
            ws.interval_value,
            ws.interval_unit,
            ws.next_water_at
        FROM watering_settings ws
        WHERE ws.schedule_enabled = 1
          AND ws.next_water_at IS NOT NULL
          AND ws.next_water_at <= NOW()
          AND NOT EXISTS (
              SELECT 1
              FROM watering_commands wc
              WHERE wc.pot_id = ws.pot_id
                AND wc.status IN ('PENDING', 'RUNNING')
              LIMIT 1
          )
        ORDER BY ws.next_water_at ASC
        `
    );

    return settings;
}

async function createScheduleWateringCommand(setting) {
    const connection = await promiseDb.getConnection();

    try {
        await connection.beginTransaction();

        const [activeCommands] = await connection.query(
            `
            SELECT id
            FROM watering_commands
            WHERE pot_id = ?
              AND status IN ('PENDING', 'RUNNING')
            LIMIT 1
            FOR UPDATE
            `,
            [setting.pot_id]
        );

        if (activeCommands.length > 0) {
            await connection.rollback();
            return false;
        }

        await connection.query(
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
            VALUES (?, 'WATER', 'SCHEDULE', ?, 'PENDING', NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE))
            `,
            [setting.pot_id, setting.duration_ms, COMMAND_EXPIRE_MINUTES]
        );

        await connection.query(
            `
            UPDATE watering_settings
            SET next_water_at =
                CASE
                    WHEN interval_unit = 'WEEK'
                    THEN TIMESTAMP(DATE(DATE_ADD(NOW(), INTERVAL interval_value WEEK)), watering_time)
                    ELSE TIMESTAMP(DATE(DATE_ADD(NOW(), INTERVAL interval_value DAY)), watering_time)
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE pot_id = ?
            `,
            [setting.pot_id]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function createScheduleWateringCommands() {
    const settings = await getDueScheduleSettings();
    let createdCount = 0;

    for (const setting of settings) {
        const created = await createScheduleWateringCommand(setting);
        if (created) {
            createdCount += 1;
        }
    }

    return createdCount;
}

async function runWateringScheduler() {
    if (isRunning) return;

    isRunning = true;

    try {
        await expirePendingCommands();

        const autoCount = await createAutoWateringCommands();
        const scheduleCount = await createScheduleWateringCommands();

        if (autoCount > 0 || scheduleCount > 0) {
            console.log(
                `[watering scheduler] AUTO ${autoCount}, SCHEDULE ${scheduleCount} command(s) created`
            );
        }
    } catch (error) {
        console.error("[watering scheduler] error:", error);
    } finally {
        isRunning = false;
    }
}

function startWateringScheduler() {
    cron.schedule(SCHEDULER_CRON, runWateringScheduler, {
        timezone: "Asia/Seoul",
    });

    runWateringScheduler();
    console.log("[watering scheduler] started");
}

module.exports = startWateringScheduler;
