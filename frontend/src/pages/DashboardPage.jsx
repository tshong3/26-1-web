// src/pages/DashboardPage.jsx
import React from 'react';
import useSensorStore from '../store/useSensorStore';
import SensorCard from '../components/SensorCard';
import './DashboardPage.css';

function DashboardPage() {
  // Zustand 저장소에서 데이터(history)와 함수(addHistory)를 모두 꺼내옵니다.
  const { sensorData, wateringHistory, addWateringHistory } = useSensorStore();

  // 💡 버튼을 눌렀을 때 실행될 함수
  const handleManualWatering = () => {
    // 1. 사용자에게 알림 띄우기
    alert('아두이노로 수동 물 주기 명령을 전송했습니다! (가동 시간: 15초)');
    
    // 2. 저장소의 함수를 호출하여 새로운 기록을 리스트에 추가하기
    addWateringHistory('수동 물 주기', '15초');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>대시보드</h2>
        <p>실시간 센서 데이터 및 식물 관리 현황</p>
      </div>

      <div className="sensor-cards-wrapper">
        <SensorCard 
          title="토양 습도" 
          value={sensorData.soilMoisture} 
          unit="%" 
          icon="💧" 
          badge="보통"
        />
        <SensorCard 
          title="온도" 
          value={sensorData.temperature} 
          unit="°C" 
          icon="🌡️" 
        />
        <SensorCard 
          title="주변 습도" 
          value={sensorData.humidity} 
          unit="%" 
          icon="💨" 
        />
      </div>

      <div className="control-history-wrapper">
        
        {/* 왼쪽: 물 주기 제어 패널 */}
        <div className="control-panel">
          <h3 className="panel-title">물 주기 제어</h3>
          
          <div className="auto-water-info">
            <span className="info-icon">ⓘ</span>
            <div>
              <strong>자동 물 주기 상태</strong>
              <p>토양 습도가 30% 이하로 떨어지면 자동으로 물 주기가 시작됩니다.</p>
            </div>
          </div>

          {/* 💡 onClick 이벤트 연결 */}
          <button className="manual-water-btn" onClick={handleManualWatering}>
            <span>💧</span> 수동 물 주기
          </button>
          
          <div className="last-update">
            <span>🕒</span> 마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>

        {/* 오른쪽: 물 주기 기록 패널 */}
        <div className="history-panel">
          <h3 className="panel-title">물 주기 기록</h3>
          
          <div className="history-list">
            {/* 💡 배열 데이터를 map으로 순회하며 동적으로 렌더링 */}
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