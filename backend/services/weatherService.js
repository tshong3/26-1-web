const API_KEY = process.env.OPENWEATHER_API_KEY;
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

// 일단 서울 고정 (회의 결정사항)
const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.9780;

/**
 * 오늘 날씨 정보 조회
 * @returns {Promise<{
 *   temperature: number,    // 현재 기온 (섭씨)
 *   feels_like: number,     // 체감 온도
 *   humidity: number,       // 습도 (%)
 *   weather: string,        // "맑음", "비", "흐림" 등
 *   description: string,    // 더 상세한 설명
 *   wind_speed: number      // 풍속 (m/s)
 * } | null>}
 */
async function getCurrentWeather() {
    if (!API_KEY) {
        console.error("[weather] OPENWEATHER_API_KEY not set");
        return null;
    }

    try {
        const url = `${API_URL}?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}&appid=${API_KEY}&units=metric&lang=kr`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[weather] API error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        return {
            temperature: Math.round(data.main.temp * 10) / 10,
            feels_like: Math.round(data.main.feels_like * 10) / 10,
            humidity: data.main.humidity,
            weather: data.weather[0]?.main || "Unknown",
            description: data.weather[0]?.description || "",
            wind_speed: data.wind?.speed || 0,
        };
    } catch (error) {
        console.error("[weather] error:", error.message);
        return null;
    }
}

module.exports = {
    getCurrentWeather,
};
