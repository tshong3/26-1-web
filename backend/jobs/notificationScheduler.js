const cron = require("node-cron");
const db = require("../db/connection");
const {
    createNotification,
    shouldSendNotification,
} = require("../services/notificationService");
const { generateNotificationMessage } = require("../services/aiMessageGenerator");

const promiseDb = db.promise();

// 30분마다 실행 (매시 0분, 30분)
const SCHEDULER_CRON = "0 */30 * * * *";

// 같은 종류 알림 쿨다운 (시간)
const NOTIFICATION_COOLDOWN_HOURS = 6;

// severity 판단 기준 (적정 범위 벗어난 정도)
const CRITICAL_THRESHOLD = 10;

let isRunning = false;

/**
 * 모든 화분의 최신 센서값과 식물별 적정 범위(plant_guide)를 함께 가져옴
 */
async function getPotsWithLatestSensorData() {
    const [rows] = await promiseDb.query(
        `
        SELECT
            p.id AS pot_id,
            p.user_id,
            pg.name AS plant_name,
            pg.temperature_min,
            pg.temperature_max,
            pg.soil_moisture_min,
            pg.soil_moisture_max,
            pg.humidity_min,
            pg.humidity_max,
            pg.light_min,
            pg.light_max,
            sd.temperature,
            sd.humidity,
            sd.soil_moisture,
            sd.light,
            sd.created_at AS sensor_at
        FROM pot p
        JOIN plant_guide pg ON p.plant_id = pg.id
        LEFT JOIN sensor_data sd
            ON sd.id = (
                SELECT latest.id
                FROM sensor_data latest
                WHERE latest.pot_id = p.id
                ORDER BY latest.created_at DESC, latest.id DESC
                LIMIT 1
            )
        WHERE p.user_id IS NOT NULL
          AND p.plant_id IS NOT NULL
        `
    );

    return rows;
}

/**
 * severity 자동 판단: 적정 범위에서 N 이상 벗어나면 critical, 아니면 warning
 */
function determineSeverity(value, min, max) {
    if (value < min - CRITICAL_THRESHOLD) return "critical";
    if (value > max + CRITICAL_THRESHOLD) return "critical";
    return "warning";
}

/**
 * 화분 한 개의 센서값을 검사하고 이상이 있으면 알림 후보 목록 반환
 */
function checkAbnormalConditions(pot) {
    const issues = [];
    const plantLabel = pot.plant_name || "식물";

    // 센서값이 아예 없으면 검사 스킵
    if (pot.sensor_at === null) {
        return issues;
    }

    // 온도 검사
    if (pot.temperature !== null && pot.temperature_min !== null && pot.temperature_max !== null) {
        const value = Number(pot.temperature);
        if (value < pot.temperature_min || value > pot.temperature_max) {
            const severity = determineSeverity(value, pot.temperature_min, pot.temperature_max);
            const direction = value > pot.temperature_max ? "높아요" : "낮아요";
            issues.push({
                type: "temperature",
                severity,
                message: `${plantLabel}의 온도가 ${direction}. 현재 ${value}도 (적정: ${pot.temperature_min}~${pot.temperature_max}도)`,
            });
        }
    }

    // 토양 수분 검사
    if (pot.soil_moisture !== null && pot.soil_moisture_min !== null && pot.soil_moisture_max !== null) {
        const value = pot.soil_moisture;
        if (value < pot.soil_moisture_min || value > pot.soil_moisture_max) {
            const severity = determineSeverity(value, pot.soil_moisture_min, pot.soil_moisture_max);
            const direction = value > pot.soil_moisture_max ? "과해요" : "부족해요";
            issues.push({
                type: "soil_moisture",
                severity,
                message: `${plantLabel}의 토양 수분이 ${direction}. 현재 ${value}% (적정: ${pot.soil_moisture_min}~${pot.soil_moisture_max}%)`,
            });
        }
    }

    // 공기 습도 검사
    if (pot.humidity !== null && pot.humidity_min !== null && pot.humidity_max !== null) {
        const value = Number(pot.humidity);
        if (value < pot.humidity_min || value > pot.humidity_max) {
            const severity = determineSeverity(value, pot.humidity_min, pot.humidity_max);
            const direction = value > pot.humidity_max ? "높아요" : "낮아요";
            issues.push({
                type: "humidity",
                severity,
                message: `${plantLabel}의 주변 습도가 ${direction}. 현재 ${value}% (적정: ${pot.humidity_min}~${pot.humidity_max}%)`,
            });
        }
    }

    // 조도 검사
    if (pot.light !== null && pot.light_min !== null && pot.light_max !== null) {
        const value = pot.light;
        if (value < pot.light_min || value > pot.light_max) {
            const severity = determineSeverity(value, pot.light_min, pot.light_max);
            const direction = value > pot.light_max ? "강해요" : "부족해요";
            issues.push({
                type: "light",
                severity,
                message: `${plantLabel}의 조도가 ${direction}. 현재 ${value} (적정: ${pot.light_min}~${pot.light_max})`,
            });
        }
    }

    return issues;
}

async function runNotificationScheduler() {
    if (isRunning) return;
    isRunning = true;

    let createdCount = 0;
    let skippedCount = 0;

    try {
        const pots = await getPotsWithLatestSensorData();

        for (const pot of pots) {
            const issues = checkAbnormalConditions(pot);

            for (const issue of issues) {
                const canSend = await shouldSendNotification(
                    pot.pot_id,
                    issue.type,
                    NOTIFICATION_COOLDOWN_HOURS
                );

                if (!canSend) {
                    skippedCount += 1;
                    continue;
                }

                // AI에게 자연스러운 메시지 생성 요청 (실패 시 템플릿 메시지로 폴백)
                const aiContext = {
                    plantLabel: pot.plant_name || "식물",
                    type: issue.type,
                    severity: issue.severity,
                    sensor: {
                        temperature: pot.temperature !== null ? Number(pot.temperature) : null,
                        humidity: pot.humidity !== null ? Number(pot.humidity) : null,
                        soil_moisture: pot.soil_moisture,
                        light: pot.light,
                    },
                    target: {
                        temperature_min: pot.temperature_min,
                        temperature_max: pot.temperature_max,
                        soil_moisture_min: pot.soil_moisture_min,
                        soil_moisture_max: pot.soil_moisture_max,
                        humidity_min: pot.humidity_min,
                        humidity_max: pot.humidity_max,
                        light_min: pot.light_min,
                        light_max: pot.light_max,
                    },
                };

                const finalMessage = await generateNotificationMessage(
                    aiContext,
                    issue.message
                );

                await createNotification({
                    userId: pot.user_id,
                    potId: pot.pot_id,
                    type: issue.type,
                    severity: issue.severity,
                    message: finalMessage,
                });
                createdCount += 1;
            }
        }

        if (createdCount > 0 || skippedCount > 0) {
            console.log(
                `[notification scheduler] created ${createdCount}, skipped ${skippedCount} (cooldown)`
            );
        }
    } catch (error) {
        console.error("[notification scheduler] error:", error);
    } finally {
        isRunning = false;
    }
}

function startNotificationScheduler() {
    cron.schedule(SCHEDULER_CRON, runNotificationScheduler, {
        timezone: "Asia/Seoul",
    });

    runNotificationScheduler();
    console.log("[notification scheduler] started");
}

module.exports = startNotificationScheduler;
