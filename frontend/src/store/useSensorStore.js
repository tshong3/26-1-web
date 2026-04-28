// src/store/useSensorStore.js
import { create } from 'zustand';

const useSensorStore = create((set) => ({
  // 1. 초기 더미(가짜) 센서 데이터
  sensorData: {
    soilMoisture: 42.9,
    temperature: 24.5,
    humidity: 60.3,
  },
  
  // 2. 초기 물 주기 기록 데이터 (피그마 디자인의 텍스트를 데이터화)
  wateringHistory: [
    { id: 1, type: '자동 물 주기', date: '2026. 4. 22. 오후 1:24:59', duration: '30초' },
    { id: 2, type: '수동 물 주기', date: '2026. 4. 22. 오전 7:24:59', duration: '45초' }
  ],

  // 3. 센서 데이터 업데이트 함수
  updateSensorData: (newData) => set((state) => ({
    sensorData: { ...state.sensorData, ...newData }
  })),

  // 4. 새로운 물 주기 기록을 추가하는 함수
  addWateringHistory: (type, duration) => set((state) => {
    const now = new Date();
    // 현재 시간을 한국 보기 편한 형식으로 포맷팅 (예: 2026. 4. 22. 오후 3:55:10)
    const dateString = now.toLocaleString('ko-KR'); 
    
    const newRecord = {
      id: Date.now(), // 고유한 키값 생성
      type: type,
      date: dateString,
      duration: duration
    };

    return {
      // 기존 기록들(...state.wateringHistory) 맨 앞에 새로운 기록을 추가합니다.
      wateringHistory: [newRecord, ...state.wateringHistory]
    };
  }),
}));

export default useSensorStore;