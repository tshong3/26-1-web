const cron = require("node-cron");
const db = require("../db/connection");
const { createNotification } = require("../services/notificationService");
const { getCurrentWeather } = require("../services/weatherService");
const { generateDailyWeatherTip } = require("../services/aiMessageGenerator");

const promiseDb = db.promise();

// 매일 오전 8시 0분 실행 (한국 시간)
const SCHEDULER_CRON = "0 0 8 * * *";

let isRunning = false;

/**
 * 화분 + 식물 정보 모두 가져오기
 */
async function getAllPotsWithPlant() {
    const [rows] = await promiseDb.query(
        `
        SELECT
            p.id AS pot_id,
            p.user_id,
            pg.name AS plant_name
        FROM pot p
        JOIN plant_guide pg ON p.plant_id = pg.id
        WHERE p.user_id IS NOT NULL
          AND p.plant_id IS NOT NULL
        `
    );
    return rows;
}

function buildFallbackMessage(plantName, weather) {
    return `오늘은 ${weather.description}, 기온 ${weather.temperature}도예요. ${plantName} 관리에 참고하세요.`;
}

async function runDailyWeatherScheduler() {
    if (isRunning) return;
    isRunning = true;

    try {
        // 1. 오늘 날씨 1회 조회 (모든 사용자 동일)
        const weather = await getCurrentWeather();
        if (!weather) {
            console.error("[daily weather] failed to fetch weather, skip");
            return;
        }

        // 2. 모든 화분 가져오기
        const pots = await getAllPotsWithPlant();
        if (pots.length === 0) {
            console.log("[daily weather] no active pots");
            return;
        }

        // 3. 화분별로 AI 메시지 생성 + 알림 INSERT
        let createdCount = 0;
        for (const pot of pots) {
            const fallback = buildFallbackMessage(pot.plant_name, weather);
            const message = await generateDailyWeatherTip(
                { plantName: pot.plant_name, weather },
                fallback
            );

            await createNotification({
                userId: pot.user_id,
                potId: pot.pot_id,
                type: "system",
                severity: "info",
                message,
            });
            createdCount += 1;
        }

        console.log(`[daily weather] created ${createdCount} notification(s)`);
    } catch (error) {
        console.error("[daily weather] error:", error);
    } finally {
        isRunning = false;
    }
}

function startDailyWeatherScheduler() {
    cron.schedule(SCHEDULER_CRON, runDailyWeatherScheduler, {
        timezone: "Asia/Seoul",
    });

    console.log("[daily weather] started (runs daily at 08:00 KST)");
}

module.exports = startDailyWeatherScheduler;
