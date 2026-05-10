import api from './api'; 

export const wateringService = {
  // 급수 설정 조회
  getSettings: async (potId) => {
    const response = await api.get(`/api/watering/settings/${potId}`);
    return response.data; // { success, data }
  },

  // 급수 설정 저장
  saveSettings: async (potId, settings) => {

    const response = await api.post(`/api/watering/settings/${potId}`, settings);
    return response.data; // { success, message, data }
  },

  // 수동 급수 명령
  manualWater: async (potId, durationMs) => {
    const body = {};
    if (durationMs != null) {
      body.duration_ms = durationMs;
    }
    const response = await api.post(`/api/watering/manual/${potId}`, body);
    return response.data;
  },

  // 급수 로그 조회
  getLogs: async (potId, limit = 50) => {
    const response = await api.get(`/api/watering/logs/${potId}`, {
      params: { limit },
    });
    return response.data; 
  },
};