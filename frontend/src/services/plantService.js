
import api from './api'; 

export const plantService = {
  // 식물 도감 리스트 조회

  getGuide: async () => {
    const response = await api.get('/api/plants/guide');
    return response.data; // { success, data: [...] }
  },

  // 내 화분 등록
  registerPot: async ({ plant_id, pot_id, nickname }) => {
    const response = await api.post('/api/plants/register', {
      plant_id,
      pot_id,
      nickname,
    });
    return response.data; 
  },

  // 내 화분 목록 조회
  getMyPots: async () => {
    const response = await api.get('/api/plants/pots');
    return response.data;
  },

  // 화분 상세 조회
  getPotDetail: async (potId) => {
    const response = await api.get(`/api/plants/pots/${potId}`);
    return response.data;
  },

  // 화분 수정

  updatePot: async (potId, payload) => {
    const response = await api.put(`/api/plants/pots/${potId}`, payload);
    return response.data;
  },

  // 6) 화분 삭제

  deletePot: async (potId) => {
    const response = await api.delete(`/api/plants/pots/${potId}`);
    return response.data;
  },
};