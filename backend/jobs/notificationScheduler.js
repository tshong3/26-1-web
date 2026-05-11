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

let isRunning = false;

/**
 * 모든 화분의 최신 센서값과 적정 범위를 함께 가져옴
 */
async function getPotsWithLatestSensorData() {
    const [rows] = await promiseDb.query(
        `
        SELECT
            p.id AS pot_id,
            p.user_id,
            p.nickname,
            p.plant_name,
            p.target_temp_min,
            p.target_temp_max,
            p.target_moisture_min,
            p.target_moisture_max,
            sd.temperature,
            sd.humidity,
            sd.soil_moisture,
            sd.light,
            sd.created_at AS sensor_at
        FROM pot p
        LEFT JOIN sensor_data sd
            ON sd.id = (
                SELECT latest.id
                FROM sensor_data latest
                WHERE latest.pot_id = p.id
                ORDER BY latest.created_at DESC, latest.id DESC
                LIMIT 1
            )
        WHERE p.user_id IS NOT NULL
        `
    );

    return rows;
}

/**
 * 화분 한 개의 센서값을 검사하고 이상이 있으면 알림 후보 목록 반환
 * @returns {Array<{ type, severity, message }>}
 */
function checkAbnormalConditions(pot) {
    const issues = [];
    const plantLabel = pot.nickname || pot.plant_name || "식물";

    // 센서값이 아예 없으면 검사 스킵
    if (pot.sensor_at === null) {
        return issues;
    }

    // 온도 검사
    if (pot.temperature !== null && pot.target_temp_min !== null && pot.target_temp_max !== null) {
        const temp = Number(pot.temperature);
        if (temp > pot.target_temp_max) {
            issues.push({
                type: "temperature",
                severity: temp > pot.target_temp_max + 5 ? "critical" : "warning",
                message: `${plantLabel}이(가) 너무 더워요. 현재 ${temp}도 (적정: ${pot.target_temp_min}~${pot.target_temp_max}도)`,
            });
        } else if (temp < pot.target_temp_min) {
            issues.push({
                type: "temperature",
                severity: temp < pot.target_temp_min - 5 ? "critical" : "warning",
                message: `${plantLabel}이(가) 너무 추워요. 현재 ${temp}도 (적정: ${pot.target_temp_min}~${pot.target_temp_max}도)`,
            });
        }
    }

    // 토양 수분 검사
    if (pot.soil_moisture !== null && pot.target_moisture_min !== null && pot.target_moisture_max !== null) {
        const moisture = Number(pot.soil_moisture);
        if (moisture < pot.target_moisture_min) {
            issues.push({
                type: "soil_moisture",
                severity: moisture < pot.target_moisture_min - 10 ? "critical" : "warning",
                message: `${plantLabel}의 토양이 건조해요. 현재 수분 ${moisture}% (적정: ${pot.target_moisture_min}~${pot.target_moisture_max}%)`,
            });
        } else if (moisture > pot.target_moisture_max) {
            issues.push({
                type: "soil_moisture",
                severity: "info",
                message: `${plantLabel}의 토양이 너무 축축해요. 현재 수분 ${moisture}% (적정: ${pot.target_moisture_min}~${pot.target_moisture_max}%)`,
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
                    plantLabel: pot.nickname || pot.plant_name || "식물",
                    type: issue.type,
                    severity: issue.severity,
                    sensor: {
                        temperature: pot.temperature !== null ? Number(pot.temperature) : null,
                        humidity: pot.humidity !== null ? Number(pot.humidity) : null,
                        soil_moisture: pot.soil_moisture,
                        light: pot.light,
                    },
                    target: {
                        temp_min: pot.target_temp_min,
                        temp_max: pot.target_temp_max,
                        moisture_min: pot.target_moisture_min,
                        moisture_max: pot.target_moisture_max,
                    },
                };

                const finalMessage = await generateNotificationMessage(
                    aiContext,
                    issue.message  // 폴백: 기존 템플릿 메시지
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
