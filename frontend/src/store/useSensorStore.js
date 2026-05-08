import { create } from 'zustand';
import { authService } from '../services/authService';

const useSensorStore = create((set) => ({
  // 로그인 상태 관리: 새로고침 시에도 유지되도록 로컬 스토리지 확인
  isLoggedIn: !!localStorage.getItem('token'),

  // 테스트용 임시 계정: 이메일에 test 입력하면 로그인 성공
  login: async (email, password) => {
    if (email === 'test@test.com') {
      localStorage.setItem('token', 'dev-fake-token');
      set({ isLoggedIn: true });
      return { success: true };
    }

    // 실제 백엔드 API와 연동된 비동기 로그인 함수
    try {
      const data = await authService.login(email, password);
      // 성공 시 전달받은 토큰을 로컬 스토리지에 저장
      localStorage.setItem('token', data.token); 
      set({ isLoggedIn: true });
      return { success: true };
    } catch (error) {
      console.error('로그인 에러:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요.' 
      };
    }
  },

  // 백엔드 API와 연동된 비동기 로그아웃 함수
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('로그아웃 에러:', error);
    } finally {
      // 무조건 로컬 스토리지에서 토큰 삭제 후 상태 변경
      localStorage.removeItem('token');
      set({ isLoggedIn: false });
    }
  },

  // =====================================================================
  // --- 아래는 혜성님이 기존에 작성하신 데이터와 함수들을 100% 그대로 유지했습니다 ---
  // =====================================================================

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