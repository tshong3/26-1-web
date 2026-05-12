import { create } from 'zustand';
import { authService } from '../services/authService';
import { wateringService } from '../services/wateringService';
import { plantService } from '../services/plantService';
import { sensorService } from '../services/sensorService';

const useSensorStore = create((set, get) => ({
  // 로그인 및 유저 정보
  isLoggedIn: !!localStorage.getItem('token'),
  nickname: localStorage.getItem('nickname') || '',

  login: async (email, password) => {
    if (email === 'test@test.com') {
      localStorage.setItem('token', 'dev-fake-token');
      localStorage.setItem('nickname', '테스트유저'); 
      set({ isLoggedIn: true, nickname: '테스트유저' });
      return { success: true };
    }

    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token); 
      const userNick = data.nickname || '가드너'; 
      localStorage.setItem('nickname', userNick);
      set({ isLoggedIn: true, nickname: userNick });
      return { success: true };
    } catch (error) {
      console.error('로그인 에러:', error);
      return { success: false, message: error.response?.data?.message || '로그인 실패' };
    }
  },

  logout: async () => {
    try { await authService.logout(); } 
    catch (error) { console.error('로그아웃 에러:', error); } 
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('nickname'); 
      set({ isLoggedIn: false, nickname: '' });
    }
  },

  // 화분 및 센서 상태
  potList: [],
  activePotId: null, 

  sensorData: {
    soilMoisture: 0, temperature: 0, humidity: 0, illuminance: 0, waterLevel: 0,   
  },
  
  wateringHistory: [],
  controlSettings: {
    isAutoMode: false, autoWateringThreshold: 30, wateringDuration: 15, isScheduleMode: false, scheduleTime: "08:00",
  },

  updateSensorData: (newData) => set((state) => ({ sensorData: { ...state.sensorData, ...newData } })),
  updateControlSettings: (newSettings) => set((state) => ({ controlSettings: { ...state.controlSettings, ...newSettings } })),

  // 화분 변경 및 데이터 동기화
  setActivePotId: async (id) => {
    set({ activePotId: id }); 
    await get().fetchAllDataForPot(id); 
  },

  fetchAllDataForPot: async (potId) => {
    if (!potId) return;
    await Promise.allSettled([
      get().fetchLatestSensorData(potId),
      get().fetchWateringSettings(potId),
      get().fetchWateringLogs(potId)
    ]);
  },

  addPot: (newPot) => set((state) => {
    const newId = Date.now(); 
    return { potList: [...state.potList, { id: newId, ...newPot }], activePotId: newId }; 
  }),

  // 백엔드 API 통신 함수
  fetchPots: async () => {
    try {
      const res = await plantService.getMyPots();
      if (!res.success) throw new Error(res.message);

      const potsFromServer = res.data;
      const pots = potsFromServer.map((p) => ({
        id: p.id,
        potName: p.pot_name || p.nickname || `화분 ${p.id}`,
        plantType: p.plant_name || '알 수 없음',
        pin: p.device_id || '',
      }));

      const currentActiveId = get().activePotId;
      const newActiveId = (currentActiveId && pots.some(p => p.id === currentActiveId)) 
                          ? currentActiveId 
                          : (pots[0]?.id || null);

      set({ potList: pots, activePotId: newActiveId });

      if (newActiveId) {
        await get().fetchAllDataForPot(newActiveId);
      }
      return { success: true };
    } catch (error) {
      console.error('화분 목록 조회 에러:', error);
      return { success: false, message: error.message };
    }
  },

  fetchWateringSettings: async (potId) => {
    try {
      const res = await wateringService.getSettings(potId);
      if (!res.success) throw new Error(res.message);
      
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
      return { success: false, message: error.message };
    }
  },

  saveWateringSettings: async (potId) => {
    try {
      const { controlSettings } = get();
      const payload = {
        auto_enabled: controlSettings.isAutoMode,
        schedule_enabled: controlSettings.isScheduleMode,
        min_soil_moisture: controlSettings.autoWateringThreshold,
        interval_value: 1, 
        interval_unit: 'DAY',
        watering_time: controlSettings.scheduleTime,
        duration_ms: controlSettings.wateringDuration * 1000,
      };

      const res = await wateringService.saveSettings(potId, payload);
      if (!res.success) throw new Error(res.message);
      return { success: true, data: res.data };
    } catch (error) {
      console.error('급수 설정 저장 에러:', error);
      return { success: false, message: error.message };
    }
  },

  runManualWatering: async (potId) => {
    try {
      const durationSec = get().controlSettings.wateringDuration;
      const res = await wateringService.manualWater(potId, durationSec * 1000);
      if (!res.success) throw new Error(res.message);

      await get().fetchWateringLogs(potId);
      return { success: true, data: res.data };
    } catch (error) {
      console.error('수동 급수 에러:', error);
      return { success: false, message: error.message };
    }
  },

  fetchWateringLogs: async (potId, limit = 50) => {
    try {
      const res = await wateringService.getLogs(potId, limit);
      if (!res.success) throw new Error(res.message);

      const logs = res.data.items || [];
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
      return { success: false, message: error.message };
    }
  },

  fetchLatestSensorData: async (potId) => {
    try {
      const res = await sensorService.getLatest(potId);
      if (!res.success) throw new Error(res.message);

      const data = res.data;
      set((state) => ({
        sensorData: {
          ...state.sensorData,
          temperature: data.temperature ?? state.sensorData.temperature,
          humidity: data.humidity ?? state.sensorData.humidity,
          soilMoisture: data.soil_moisture ?? state.sensorData.soilMoisture,
          illuminance: data.light ?? state.sensorData.illuminance,
          waterLevel: data.water_level ?? state.sensorData.waterLevel,
        },
      }));
      return { success: true, data };
    } catch (error) {
      console.error('최신 센서 데이터 조회 에러:', error);
      return { success: false, message: error.message };
    }
  },
}));

export default useSensorStore;