const db = require("../db/connection");
const { createNotification } = require("./notificationService");

const promiseDb = db.promise();

/**
 * 자동/예약 급수 알림 발송
 * 
 * @param {number} potId - 급수가 일어난 화분 ID
 * @param {string} commandType - 'AUTO' | 'SCHEDULE' | 'MANUAL' (MANUAL은 알림 안 보냄)
 * @param {boolean} success - 급수 성공 여부
 * @param {string} [errorMessage] - 실패 시 상세 메시지
 * @returns {Promise<void>}
 */
async function sendWateringNotification(potId, commandType, success, errorMessage) {
    // 수동 급수는 사용자가 직접 누른 거라 알림 안 보냄
    if (commandType === "MANUAL") {
        return;
    }

    try {
        // 화분 + 식물 정보 조회
        const [rows] = await promiseDb.query(
            `
            SELECT 
                p.user_id,
                pg.name AS plant_name
            FROM pot p
            LEFT JOIN plant_guide pg ON p.plant_id = pg.id
            WHERE p.id = ?
            `,
            [potId]
        );

        if (rows.length === 0) {
            console.warn(`[watering notification] pot ${potId} not found`);
            return;
        }

        const { user_id, plant_name } = rows[0];
        if (!user_id) {
            console.warn(`[watering notification] pot ${potId} has no user`);
            return;
        }

        const plantLabel = plant_name || "식물";
        const message = buildMessage(plantLabel, commandType, success, errorMessage);
        const severity = success ? "info" : "warning";

        await createNotification({
            userId: user_id,
            potId,
            type: "system",
            severity,
            message,
        });

        console.log(
            `[watering notification] sent (pot=${potId}, type=${commandType}, success=${success})`
        );
    } catch (error) {
        // 알림 실패해도 급수 자체엔 영향 없게 catch
        console.error("[watering notification] error:", error.message);
    }
}

function buildMessage(plantLabel, commandType, success, errorMessage) {
    if (!success) {
        const detail = errorMessage ? ` (${errorMessage})` : "";
        return `${plantLabel} 급수 중 문제가 발생했어요.${detail}`;
    }

    if (commandType === "AUTO") {
        return `${plantLabel}에 자동으로 물을 주었습니다.`;
    }

    if (commandType === "SCHEDULE") {
        return `${plantLabel}에 예약된 시간에 물을 주었습니다.`;
    }

    return `${plantLabel}에 물을 주었습니다.`;
}

module.exports = {
    sendWateringNotification,
};
