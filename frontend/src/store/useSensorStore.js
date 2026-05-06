import { create } from 'zustand';

const useSensorStore = create((set) => ({
  // 로그인 상태 관리
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),

  // 내 화분 목록 데이터
  potList: [
    { id: 1, potName: '안방 화분', plantType: '장미', pin: '123456' },
    { id: 2, potName: '거실 창가', plantType: '몬스테라', pin: '654321' }
  ],
  activePotId: 1, 

  // 센서 데이터
  sensorData: {
    soilMoisture: 42.9,
    temperature: 24.5,
    humidity: 60.3,
    illuminance: 850, 
    waterLevel: 75,   
  },
  
  // 기록 및 제어 설정
  wateringHistory: [
    { id: 1, type: '자동 물 주기', date: '2026. 4. 22. 오후 1:24:59', duration: '30초' },
    { id: 2, type: '수동 물 주기', date: '2026. 4. 22. 오전 7:24:59', duration: '45초' }
  ],
  controlSettings: {
    isAutoMode: true,
    autoWateringThreshold: 30,
    wateringDuration: 15,
    isScheduleMode: false,
    scheduleTime: "08:00",
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

  addPot: (newPot) => set((state) => ({
    potList: [...state.potList, { id: Date.now(), ...newPot }]
  })),
  setActivePotId: (id) => set({ activePotId: id }),
}));

export default useSensorStore;