const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 200;

/**
 * 화분 상태 컨텍스트로 자연스러운 알림 메시지를 생성한다.
 * AI 호출 실패 시 fallbackMessage를 반환한다.
 *
 * @param {Object} context
 * @param {string} context.plantLabel - 식물명 (예: "장미")
 * @param {string} context.type - 'temperature' | 'humidity' | 'soil_moisture' | 'light'
 * @param {string} context.severity - 'info' | 'warning' | 'critical'
 * @param {Object} context.sensor - { temperature, humidity, soil_moisture, light }
 * @param {Object} context.target - plant_guide의 4개 항목 min/max
 * @param {Object} [context.lastWatering] - 자동 급수 정보 (optional)
 * @param {string} fallbackMessage - AI 호출 실패 시 사용할 메시지
 * @returns {Promise<string>} - 생성된 메시지 (또는 fallbackMessage)
 */
async function generateNotificationMessage(context, fallbackMessage) {
    try {
        const prompt = buildPrompt(context);

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            messages: [{ role: "user", content: prompt }],
        });

        const text = response.content?.[0]?.text?.trim();

        // 응답 형식 검증: 비어있거나 너무 길면 폴백
        if (!text || text.length < 5 || text.length > 200) {
            console.warn("[ai message] invalid response, using fallback");
            return fallbackMessage;
        }

        return text;
    } catch (error) {
        console.error("[ai message] error:", error.message);
        return fallbackMessage;
    }
}

function buildPrompt({ plantLabel, type, severity, sensor, target, lastWatering }) {
    const typeKor = {
        temperature: "온도",
        humidity: "주변 공기 습도",
        soil_moisture: "토양 수분",
        light: "조도",
    }[type] || "센서값";

    const severityKor = {
        info: "참고 알림",
        warning: "주의 알림",
        critical: "긴급 알림",
    }[severity] || "알림";

    let situation = `[${severityKor}] ${plantLabel}의 ${typeKor}가 적정 범위를 벗어났습니다.\n\n`;

    situation += `현재 센서값:\n`;
    if (sensor.temperature !== null) situation += `- 온도: ${sensor.temperature}도\n`;
    if (sensor.humidity !== null) situation += `- 주변 공기 습도: ${sensor.humidity}%\n`;
    if (sensor.soil_moisture !== null) situation += `- 토양 수분: ${sensor.soil_moisture}%\n`;
    if (sensor.light !== null) situation += `- 조도: ${sensor.light}\n`;

    situation += `\n적정 범위:\n`;
    if (target.temperature_min !== null && target.temperature_max !== null) {
        situation += `- 온도: ${target.temperature_min}~${target.temperature_max}도\n`;
    }
    if (target.soil_moisture_min !== null && target.soil_moisture_max !== null) {
        situation += `- 토양 수분: ${target.soil_moisture_min}~${target.soil_moisture_max}%\n`;
    }
    if (target.humidity_min !== null && target.humidity_max !== null) {
        situation += `- 주변 공기 습도: ${target.humidity_min}~${target.humidity_max}%\n`;
    }
    if (target.light_min !== null && target.light_max !== null) {
        situation += `- 조도: ${target.light_min}~${target.light_max}\n`;
    }

    if (lastWatering) {
        situation += `\n최근 자동 급수 정보:\n`;
        situation += `- 시간: ${lastWatering.created_at}\n`;
        situation += `- 결과: ${lastWatering.success ? "성공" : "실패"}\n`;
        if (lastWatering.message) {
            situation += `- 상세: ${lastWatering.message}\n`;
        }
    }

    situation += `
위 상황을 사용자에게 알리는 한국어 메시지를 작성해주세요.

조건:
- 100자 이내
- 친근하지만 정확한 톤
- 조사 자연스럽게 처리 (식물명 + 적절한 조사)
- ${typeKor} 항목에 대해서만 이야기 (다른 센서값은 참고용일 뿐, 메시지에 포함하지 말 것)
- 사용자가 취해야 할 조치를 한 문장으로 포함
- 이모지나 특수문자 없이 평문만
- 메시지 본문만 출력 (앞뒤 설명, 인사말 없이)`;

return situation;
}
/**
 * 매일 아침 날씨 기반 식물 관리 메시지 생성
 *
 * @param {Object} context
 * @param {string} context.plantName - 식물명 (예: "장미")
 * @param {Object} context.weather - { temperature, humidity, weather, description, wind_speed, feels_like }
 * @param {string} fallbackMessage - AI 실패 시 사용할 메시지
 * @returns {Promise<string>}
 */
async function generateDailyWeatherTip(context, fallbackMessage) {
    try {
        const prompt = buildWeatherPrompt(context);

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            messages: [{ role: "user", content: prompt }],
        });

        const text = response.content?.[0]?.text?.trim();

        if (!text || text.length < 5 || text.length > 200) {
            console.warn("[ai weather] invalid response, using fallback");
            return fallbackMessage;
        }

        return text;
    } catch (error) {
        console.error("[ai weather] error:", error.message);
        return fallbackMessage;
    }
}

function buildWeatherPrompt({ plantName, weather }) {
    return `오늘 서울 날씨:
- 기온: ${weather.temperature}도 (체감 ${weather.feels_like}도)
- 습도: ${weather.humidity}%
- 날씨: ${weather.description}
- 풍속: ${weather.wind_speed}m/s

사용자가 키우는 식물: ${plantName}

위 정보를 바탕으로 오늘 ${plantName} 관리에 대한 조언을 한국어 메시지로 작성해주세요.

조건:
- 80자 이내
- 친근한 톤
- 오늘 날씨에 맞는 구체적인 행동 제안 1가지 포함
- 이모지나 특수문자 없이 평문만
- "오늘은" 같은 시간 표현으로 시작
- 메시지 본문만 출력 (앞뒤 설명, 인사말 없이)`;
}

module.exports = {
    generateNotificationMessage,
    generateDailyWeatherTip,
};
