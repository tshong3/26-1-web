import { create } from 'zustand';

const useSensorStore = create((set) => ({
  sensorData: {
    soilMoisture: 42.9,
    temperature: 24.5,
    humidity: 60.3,
    illuminance: 850, 
    waterLevel: 75,   
  },
  
  wateringHistory: [
    { id: 1, type: '자동 급수', date: '2026. 4. 22. 오후 1:24:59', duration: '30초' },
    { id: 2, type: '수동 급수', date: '2026. 4. 22. 오전 7:24:59', duration: '45초' }
  ],

  // 제어 설정 상태
  controlSettings: {
    isAutoMode: true, // 자동 급수 ON/OFF
    autoWateringThreshold: 30, // 토양 수분 기준 (%)
    wateringDuration: 15, // 물 주는 양 (초)
    isScheduleMode: false, // 시간 설정 ON/OFF
    scheduleTime: "08:00", // 매일 지정된 시간
  },

  updateSensorData: (newData) => set((state) => ({
    sensorData: { ...state.sensorData, ...newData }
  })),

  addWateringHistory: (type, duration) => set((state) => {
    const now = new Date();
    const dateString = now.toLocaleString('ko-KR'); 
    const newRecord = { id: Date.now(), type, date: dateString, duration };
    return { wateringHistory: [newRecord, ...state.wateringHistory] };
  }),

  updateControlSettings: (newSettings) => set((state) => ({
    controlSettings: { ...state.controlSettings, ...newSettings }
  })),
}));

export default useSensorStore;