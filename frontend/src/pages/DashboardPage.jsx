import React, { useState, useEffect } from 'react';
import useSensorStore from '../store/useSensorStore';
import SensorCard from '../components/SensorCard';
import { MdOutlineTipsAndUpdates, MdWarningAmber, MdEco } from "react-icons/md";
import './DashboardPage.css';

function DashboardPage() {
  // 화분 목록, 닉네임, 선택 상태 등을 불러옴
  const { 
    sensorData, 
    wateringHistory, 
    potList, 
    activePotId, 
    setActivePotId, 
    addPot, 
    nickname 
  } = useSensorStore();

  // 화분 등록 모달을 위한 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPotName, setNewPotName] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      // API 연결 시 주석 해제하여 10초마다 갱신
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 상태 판단 함수들
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

  // 드롭다운 선택 핸들러
  const handleDropdownChange = (e) => {
    const value = e.target.value;
    if (value === 'add_new') {
      setIsModalOpen(true);
    } else {
      setActivePotId(Number(value));
    }
  };

  // 새 화분 등록 핸들러
  const handleAddPot = (e) => {
    e.preventDefault();
    if (potList.some((pot) => pot.potName === newPotName)) {
      return alert('이미 존재하는 화분 이름입니다.');
    }
    if (!newDeviceId.trim() || newDeviceId.length < 4) {
      return alert('올바른 등록 PIN(최소 4자리 이상)을 입력해 주세요.');
    }
    
    // DB 구조에 맞게 스토어에 추가
    addPot({ potName: newPotName, plantName: newPlantName, deviceId: newDeviceId });
    alert('화분이 등록되었습니다!');
    setIsModalOpen(false);
    setNewPotName(''); setNewPlantName(''); setNewDeviceId('');
  };

  // 화분 등록 모달 컴포넌트 분리
  const renderAddPotModal = () => (
    isModalOpen && (
      <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>새로운 화분 등록</h3>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
          </div>
          <form onSubmit={handleAddPot} className="add-pot-form">
            <div className="input-group">
              <label>화분 이름</label>
              <input type="text" placeholder="예: 안방 화분" value={newPotName} onChange={(e) => setNewPotName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>식물 이름</label>
              <input type="text" placeholder="예: 장미" value={newPlantName} onChange={(e) => setNewPlantName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>등록 PIN (기기 식별용)</label>
              <input type="text" placeholder="아두이노 PIN 입력" value={newDeviceId} onChange={(e) => setNewDeviceId(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary-large" style={{ width: '100%', marginTop: '16px' }}>
              등록하기
            </button>
          </form>
        </div>
      </div>
    )
  );

  // 화분이 없을 때
  if (potList.length === 0) {
    return (
      <div className="dashboard-container empty-state">
        <div className="empty-icon" style={{ fontSize: '60px', marginBottom: '20px' }}>🪴</div>
        <h2>등록된 화분이 없습니다</h2>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>
          {nickname}님의 첫 번째 반려식물을 등록하고 스마트하게 관리해보세요!
        </p>
        <button className="btn-primary-large" onClick={() => setIsModalOpen(true)}>
          + 새 화분 등록하기
        </button>
        {renderAddPotModal()}
      </div>
    );
  }

  // 화분이 있을 때: 현재 선택된 화분 정보 가져오기
  const activePot = potList.find(p => p.id === activePotId) || potList[0];

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-header flex-header">
        <div className="header-title-group">
          <select className="pot-dropdown" value={activePot.id} onChange={handleDropdownChange}>
            {potList.map((pot) => (
              <option key={pot.id} value={pot.id}>{pot.potName}</option>
            ))}
            <option value="add_new" style={{ fontWeight: 'bold', color: '#10b981' }}>+ 새 화분 등록</option>
          </select>
          <span className="plant-tag"><MdEco /> {activePot.plantName || activePot.plantType}</span>
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

      {/* 모달 렌더링 호출 */}
      {renderAddPotModal()}
    </div>
  );
}

export default DashboardPage;