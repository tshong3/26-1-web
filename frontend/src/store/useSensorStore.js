import { create } from 'zustand';
import { authService } from '../services/authService';
import { wateringService } from '../services/wateringService';
import { plantService } from '../services/plantService';
import { sensorService } from '../services/sensorService';

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

  // 내 화분 목록 임시 데이터
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

  // 서버에서 급수 설정 가져오기
  fetchWateringSettings: async (potId) => {
    try {
      const res = await wateringService.getSettings(potId);
      if (!res.success) {
        throw new Error(res.message || '급수 설정 조회 실패');
      }

      const data = res.data;
      set((state) => ({
        controlSettings: {
          ...state.controlSettings,
          isAutoMode: data.auto_enabled,
          isScheduleMode: data.schedule_enabled,
          autoWateringThreshold: data.min_soil_moisture,
          wateringDuration: Math.round((data.duration_ms || 15000) / 1000),
          scheduleTime: data.watering_time?.slice(0, 5) || '08:00',
        },
      }));

      return { success: true, data };
    } catch (error) {
      console.error('급수 설정 조회 에러:', error);
      return {
        success: false,
        message: error.message || '급수 설정 조회 실패',
      };
    }
  },

  // 현재 물주기 기록을 서버에 저장
  saveWateringSettings: async (potId) => {
    try {
      const { controlSettings } = useSensorStore.getState();

      const payload = {
        auto_enabled: controlSettings.isAutoMode,
        schedule_enabled: controlSettings.isScheduleMode,
        min_soil_moisture: controlSettings.autoWateringThreshold,
        interval_value: 1, 
        interval_unit: 'DAY',
        watering_time: controlSettings.scheduleTime, // "08:00"
        duration_ms: controlSettings.wateringDuration * 1000,
      };

      const res = await wateringService.saveSettings(potId, payload);
      if (!res.success) {
        throw new Error(res.message || '급수 설정 저장 실패');
      }

      return { success: true, data: res.data };
    } catch (error) {
      console.error('급수 설정 저장 에러:', error);
      return {
        success: false,
        message: error.message || '급수 설정 저장 실패',
      };
    }
  },

  // 수동 급수 실행 (버튼 클릭 시 사용)
  runManualWatering: async (potId) => {
    try {
      const { controlSettings, addWateringHistory } =
        useSensorStore.getState();
      const durationSec = controlSettings.wateringDuration;

      const res = await wateringService.manualWater(
        potId,
        durationSec * 1000
      );
      if (!res.success) {
        throw new Error(res.message || '수동 물주기 실패');
      }


      addWateringHistory('수동 물 주기', `${durationSec}초`);

      return { success: true, data: res.data };
    } catch (error) {
      console.error('수동 급수 에러:', error);
      return {
        success: false,
        message: error.message || '수동 물주기 실패',
      };
    }
  },

   // 급수 로그 조회+wateringHistory에 반영
  fetchWateringLogs: async (potId, limit = 50) => {
    try {
      const res = await wateringService.getLogs(potId, limit);
      if (!res.success) {
        throw new Error(res.message || '급수 로그 조회 실패');
      }

      const logs = res.data.items;

      set({
        wateringHistory: logs.map((log) => ({
          id: log.command_id, 
          type: log.command_type === 'MANUAL' ? '수동 물 주기' : '자동 물 주기',
          date: log.created_at, 
          duration: `${Math.round((log.duration_ms || 0) / 1000)}초`,
        })),
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('급수 로그 조회 에러:', error);
      return {
        success: false,
        message: error.message || '급수 로그 조회 실패',
      };
    }
  },

  // 화분 목록 서버에서 불러오기
  fetchPots: async () => {
    try {
      const res = await plantService.getMyPots();
      if (!res.success) {
        throw new Error(res.message || '화분 목록 조회 실패');
      }

      const potsFromServer = res.data;

      set((state) => ({
        potList: potsFromServer.map((p) => ({
          id: p.id,
          potName: p.pot_name || p.nickname || `화분 ${p.id}`,
          plantType: p.plant_name || '알 수 없음',
          pin: p.device_id || '',
        })),
        activePotId:
          state.activePotId && potsFromServer.some((p) => p.id === state.activePotId)
            ? state.activePotId
            : (potsFromServer[0]?.id || null),
      }));

      return { success: true };
    } catch (error) {
      console.error('화분 목록 조회 에러:', error);
      return {
        success: false,
        message: error.message || '화분 목록 조회 실패',
      };
    }
  },

  // 최신 센서 데이터 sensorData에 반영
  fetchLatestSensorData: async (potId) => {
    try {
      const res = await sensorService.getLatest(potId);
      if (!res.success) {
        throw new Error(res.message || '최신 센서 데이터 조회 실패');
      }

      const data = res.data;

      set((state) => ({
        sensorData: {
          ...state.sensorData,
          temperature:
            data.temperature ?? state.sensorData.temperature,
          humidity:
            data.humidity ?? state.sensorData.humidity,
          soilMoisture:
            data.soil_moisture ?? state.sensorData.soilMoisture,
          illuminance:
            data.light ?? state.sensorData.illuminance,
        },
      }));

      return { success: true, data };
    } catch (error) {
      console.error('최신 센서 데이터 조회 에러:', error);
      return {
        success: false,
        message: error.message || '최신 센서 데이터 조회 실패',
      };
    }
  },
}));

export default useSensorStore;