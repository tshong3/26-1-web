import { create } from 'zustand';
import { authService } from '../services/authService';

const useSensorStore = create((set) => ({
  // 로그인 상태 관리: 새로고침 시에도 유지되도록 로컬 스토리지 확인
  isLoggedIn: !!localStorage.getItem('token'),
  
  // 닉네임 상태 추가: 로컬 스토리지에서 불러오기
  nickname: localStorage.getItem('nickname') || '',

  // 테스트용 임시 계정: 이메일에 test@test.com 입력
  login: async (email, password) => {
    if (email === 'test@test.com') {
      localStorage.setItem('token', 'dev-fake-token');
      localStorage.setItem('nickname', '테스트유저'); // 테스트용 닉네임
      set({ isLoggedIn: true, nickname: '테스트유저' });
      return { success: true };
    }

    // 실제 백엔드 API와 연동된 비동기 로그인 함수
    try {
      const data = await authService.login(email, password);
      // 성공 시 전달받은 토큰을 로컬 스토리지에 저장
      localStorage.setItem('token', data.token); 
      
      // 백엔드에서 넘겨주는 nickname을 저장(데이터가 없으면 '가드너'로 대체)
      const userNick = data.nickname || '가드너'; 
      localStorage.setItem('nickname', userNick);
      
      set({ isLoggedIn: true, nickname: userNick });
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
      // 무조건 로컬 스토리지에서 토큰과 닉네임 삭제 후 상태 변경
      localStorage.removeItem('token');
      localStorage.removeItem('nickname'); 
      set({ isLoggedIn: false, nickname: '' });
    }
  },

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

  // 새 화분 추가 시 바로 그 화분으로 선택되도록 수정
  addPot: (newPot) => set((state) => {
    const newId = Date.now();
    return { 
      potList: [...state.potList, { id: newId, ...newPot }],
      activePotId: newId 
    };
  }),
  setActivePotId: (id) => set({ activePotId: id }),
}));

export default useSensorStore;