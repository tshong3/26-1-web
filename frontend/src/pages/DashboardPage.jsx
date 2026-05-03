import React, { useEffect } from 'react';
import useSensorStore from '../store/useSensorStore';
import SensorCard from '../components/SensorCard';
import { MdOutlineTipsAndUpdates, MdWarningAmber, MdEco } from "react-icons/md";
import './DashboardPage.css';

function DashboardPage() {
  const { sensorData, wateringHistory } = useSensorStore();

  useEffect(() => {
    const interval = setInterval(() => {
      // API 연결 시 주석 해제하여 10초마다 갱신
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getMoistureStatus = (value) => {
    if (value < 20) return { status: 'danger', badge: '나쁨' };
    if (value < 30) return { status: 'warning', badge: '보통' };
    return { status: 'normal', badge: '양호' };
  };

  const getTemperatureStatus = (value) => {
    if (value < 10 || value > 32) return { status: 'danger', badge: '나쁨' };
    if (value < 18 || value > 26) return { status: 'warning', badge: '보통' };
    return { status: 'normal', badge: '양호' };
  };

  const getWaterLevelStatus = (value) => {
    if (value <= 10) return { status: 'danger', badge: '나쁨' };
    if (value <= 20) return { status: 'warning', badge: '보통' };
    return { status: 'normal', badge: '양호' };
  };

  const getOverallStatus = () => {
    if (sensorData.waterLevel <= 10) return { text: '물 보충 시급', type: 'danger', desc: '물탱크에 물이 부족하여 자동 급수가 불가능해요.' };
    if (sensorData.soilMoisture < 20) return { text: '매우 건조함', type: 'danger', desc: '토양이 매우 건조해요. 즉시 물을 주거나 급수 설정을 확인하세요.' };
    if (sensorData.illuminance < 500) return { text: '빛 부족', type: 'warning', desc: '식물이 광합성하기에 빛이 다소 부족해요. 위치를 옮겨주세요.' };
    return { text: '매우 좋음', type: 'good', desc: '식물이 건강하게 자라고 있어요.' };
  };

  const overall = getOverallStatus();

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-header">
        <div className="header-title-group">
          <h2>안방 화분</h2>
          <span className="plant-tag"><MdEco /> 장미</span>
        </div>
        <p>화분의 실시간 상태를 확인하세요.</p>
      </div>

      <div className={`overall-status-banner ${overall.type}`}>
        <div className="status-info">
          <h3>현재 상태: <strong>{overall.text}</strong></h3>
          <p>{overall.desc}</p>
        </div>
      </div>

      <div className="sensor-cards-wrapper">
        {/* 💡 물탱크 수위를 제외한 카드들에 optimalRange 속성 추가 */}
        <SensorCard 
          title="토양 습도" value={sensorData.soilMoisture} unit="%" icon="💧" 
          optimalRange="적정: 30 ~ 70%"
          {...getMoistureStatus(sensorData.soilMoisture)} 
        />
        <SensorCard 
          title="온도" value={sensorData.temperature} unit="°C" icon="🌡️" 
          optimalRange="적정: 18 ~ 26°C"
          {...getTemperatureStatus(sensorData.temperature)} 
        />
        <SensorCard 
          title="주변 습도" value={sensorData.humidity} unit="%" icon="💨" 
          optimalRange="적정: 40 ~ 70%"
          status="normal" badge="적절" 
        />
        <SensorCard 
          title="조도 (밝기)" value={sensorData.illuminance} unit="lx" icon="☀️" 
          optimalRange="적정: 500lx 이상"
          status={sensorData.illuminance < 500 ? 'warning' : 'normal'} 
          badge={sensorData.illuminance < 500 ? '어두움' : '적절'}
        />
        <SensorCard 
          title="물탱크 수위" value={sensorData.waterLevel} unit="%" icon="🌊" 
          {...getWaterLevelStatus(sensorData.waterLevel)} 
        />
      </div>

      <div className="dashboard-bottom-wrapper">
        <div className="ai-alert-panel">
          <h3 className="panel-title">AI 스마트 알림</h3>
          
          <div className="ai-message-card warning">
            <div className="ai-icon"><MdWarningAmber /></div>
            <div className="ai-content">
              <strong>물탱크 수위 부족</strong>
              <p>물탱크의 수위가 20% 미만이에요. 물을 보충해 주세요.</p>
              <span className="ai-time">방금 전</span>
            </div>
          </div>

          <div className="ai-message-card tip">
            <div className="ai-icon"><MdOutlineTipsAndUpdates /></div>
            <div className="ai-content">
              <strong>조도 상태 양호</strong>
              <p>현재 창가의 햇빛이 식물 광합성에 아주 적절한 수준(850lx)이에요.</p>
              <span className="ai-time">1시간 전</span>
            </div>
          </div>
        </div>

        <div className="history-panel">
          <h3 className="panel-title">급수 기록</h3>
          <div className="history-list">
            {wateringHistory.map((history) => (
              <div key={history.id} className="history-item">
                <div className="history-info">
                  <span className="history-icon success">✓</span>
                  <div>
                    <strong>{history.type}</strong>
                    <p>{history.date}</p>
                  </div>
                </div>
                <span className="history-duration">{history.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;