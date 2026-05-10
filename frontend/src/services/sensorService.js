import api from './api'; 

export const sensorService = {
  getLatest: async (potId) => {
    const response = await api.get(`/api/sensor-data/latest/${potId}`);
    return response.data;
  },


  getChart: async (potId, unit = 'hour') => {
    const response = await api.get(`/api/sensor-data/chart/${potId}`, {
      params: { unit },
    });
    return response.data;
  },
};