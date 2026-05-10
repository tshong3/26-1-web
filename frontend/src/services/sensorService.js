import api from './api'; 

export const sensorService = {
  getLatest: async (potId) => {
    const res = await api.get(`/api/sensor-data/latest/${potId}`);
    return res.data;
  },


  getChart: async (potId, unit = 'hour') => {
    const res = await api.get(`/api/sensor-data/chart/${potId}`, {
      params: { unit },
    });
    return res.data;
  },
};