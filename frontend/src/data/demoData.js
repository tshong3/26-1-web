export const demoPlant = { potName: 'Demo Plant', plantName: '스마트 화분 미리보기', status: '정상 관리 중' };
export const demoSensors = [
  { title: '온도', value: 25.8, unit: '°C', icon: '🌡️' }, { title: '습도', value: 54, unit: '%', icon: '💨' },
  { title: '토양 습도', value: 42, unit: '%', icon: '💧' }, { title: '조도', value: 68, unit: '%', icon: '☀️' },
  { title: '물통 잔량', value: 76, unit: '%', icon: '🌊' },
];
export const demoNotifications = [
  { title: '날씨 기반 알림', message: '오늘은 기온이 다소 높아 토양 습도 변화를 확인하는 것이 좋습니다.', type: 'weather' },
  { title: '센서값 기반 알림', message: '토양 습도가 점차 낮아지고 있어 물 주기 여부를 확인해보세요.', type: 'sensor' },
];
export const demoChartData = [
  { label: '06:00', temperature: 22.8, humidity: 61, soilMoisture: 51, light: 12 }, { label: '08:00', temperature: 23.4, humidity: 59, soilMoisture: 49, light: 30 },
  { label: '10:00', temperature: 24.2, humidity: 57, soilMoisture: 47, light: 52 }, { label: '12:00', temperature: 25.1, humidity: 55, soilMoisture: 45, light: 68 },
  { label: '14:00', temperature: 26.2, humidity: 52, soilMoisture: 43, light: 76 }, { label: '16:00', temperature: 25.8, humidity: 54, soilMoisture: 42, light: 68 },
  { label: '18:00', temperature: 24.7, humidity: 56, soilMoisture: 42, light: 41 }, { label: '20:00', temperature: 23.9, humidity: 58, soilMoisture: 41, light: 18 },
];
