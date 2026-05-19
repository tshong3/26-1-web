import React, { useState, useEffect } from 'react';
import useSensorStore from '../store/useSensorStore';
import useNotificationStore from '../store/useNotificationStore';
import SensorCard from '../components/SensorCard';
import { MdOutlineTipsAndUpdates, MdWarningAmber, MdEco, MdInfoOutline, MdErrorOutline, MdKeyboardArrowDown } from "react-icons/md";
import './DashboardPage.css';

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return '방금 전';
  if (diffInMins < 60) return `${diffInMins}분 전`;
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  return `${diffInDays}일 전`;
};

function DashboardPage() {
  const { 
    sensorData, wateringHistory, potList, activePotId, setActivePotId, 
    addPot, nickname, fetchPots, plantGuide, fetchPlantGuide
  } = useSensorStore();

  const { notifications, fetchNotifications, loading } = useNotificationStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPotName, setNewPotName] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchPots();
    fetchPlantGuide();
  }, [fetchNotifications, fetchPots, fetchPlantGuide]);

  const handleDropdownChange = (e) => {
    const value = e.target.value;
    if (value === 'add_new') setIsModalOpen(true);
    else setActivePotId(Number(value));
  };

  const handleAddPot = async (e) => {
    e.preventDefault();
    if (!newDeviceId.trim() || newDeviceId.length < 4) return alert('올바른 등록 PIN을 입력해 주세요.');
    
    let finalPlantId = selectedPlantId;
    if (!finalPlantId) {
      const exactMatch = plantGuide.find(p => p.name === newPlantName);
      if (exactMatch) {
        finalPlantId = exactMatch.id;
      } else {
        return alert('식물 종류를 선택해 주세요.');
      }
    }

    const result = await addPot({ potName: newPotName, plantId: finalPlantId, deviceId: newDeviceId });
    if (result.success) {
      alert('화분이 등록되었습니다!');
      setIsModalOpen(false);
      setNewPotName(''); setNewPlantName(''); setNewDeviceId(''); setSelectedPlantId(null);
    } else {
      alert(result.message || '화분 등록에 실패했습니다.');
    }
  };

  const filteredPlants = plantGuide.filter(plant => plant.name.includes(newPlantName));

  const renderAddPotModal = () => (
    isModalOpen && (
      <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setIsDropdownOpen(false); }}>
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
              <div className="autocomplete-wrapper">
                <input 
                  type="text" placeholder="예: 장미" value={newPlantName} 
                  onChange={(e) => {
                    setNewPlantName(e.target.value);
                    setIsDropdownOpen(true);
                    setSelectedPlantId(null); 
                  }} 
                  onFocus={() => setIsDropdownOpen(true)}
                  required 
                />
                {isDropdownOpen && newPlantName && filteredPlants.length > 0 && (
                  <ul className="autocomplete-dropdown">
                    {filteredPlants.map((plant) => (
                      <li key={plant.id} className="autocomplete-item" onClick={() => {
                        setNewPlantName(plant.name);
                        setSelectedPlantId(plant.id);
                        setIsDropdownOpen(false);
                      }}>
                        {plant.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>등록 PIN</label>
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

  if (potList.length === 0) {
    return (
      <div className="dashboard-container empty-state" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="empty-icon" style={{ fontSize: '60px', marginBottom: '20px' }}>🪴</div>
        <h2 style={{ color: '#0f172a', margin: '0 0 16px 0' }}>등록된 화분이 없습니다</h2>
        <p style={{ color: '#64748b', margin: '0 0 30px 0' }}>
          {nickname}님의 식물을 등록하고 스마트하게 관리해보세요!
        </p>
        <button className="btn-primary-large" onClick={() => setIsModalOpen(true)}>
          + 새 화분 등록하기
        </button>
        {renderAddPotModal()}
      </div>
    );
  }

  const activePot = potList.find(p => p.id === activePotId) || potList[0];

  const checkStatus = (value, min, max) => {
    if (min === null || max === null || value === null || value === undefined) {
      return { status: 'normal', badge: '양호' }; 
    }
    const val = Number(value);
    if (val >= min && val <= max) {
      return { status: 'normal', badge: '양호' };
    }
    if (val < min - 10 || val > max + 10) {
      return { status: 'danger', badge: '위험' };
    }
    return { status: 'warning', badge: '주의' };
  };

  const getWaterLevelStatus = (value) => {
    if (value <= 10) return { status: 'danger', badge: '위험' };
    if (value <= 20) return { status: 'warning', badge: '주의' };
    return { status: 'normal', badge: '양호' };
  };

  const moistureStatus = checkStatus(sensorData.soilMoisture, activePot.moistureMin, activePot.moistureMax);
  const tempStatus = checkStatus(sensorData.temperature, activePot.tempMin, activePot.tempMax);
  const humidityStatus = checkStatus(sensorData.humidity, activePot.humidityMin, activePot.humidityMax);
  const lightStatus = checkStatus(sensorData.illuminance, activePot.lightMin, activePot.lightMax);
  const waterStatus = getWaterLevelStatus(sensorData.waterLevel);

  const getOverallStatus = () => {
    const hasDanger = [moistureStatus.status, tempStatus.status, humidityStatus.status, lightStatus.status, waterStatus.status].includes('danger');
    const hasWarning = [moistureStatus.status, tempStatus.status, humidityStatus.status, lightStatus.status, waterStatus.status].includes('warning');

    if (hasDanger) {
      return { text: '긴급 조치가 필요해요', type: 'danger', desc: '위험 범위(적정값 대비 오차 10 초과)를 이탈한 센서가 있습니다. 즉시 환경을 점검해 주세요.' };
    }
    if (hasWarning) {
      return { text: '주의 관리가 필요해요', type: 'warning', desc: '주의 범위(적정값 대비 오차 10 이내)에 진입한 수치가 있습니다. 지속적인 모니터링이 권장됩니다.' };
    }
    return { text: '식물이 아주 잘 자라고 있어요', type: 'good', desc: '모든 환경 수치가 식물별 최적 영역에 존재합니다. 현재 완벽하게 관리되고 있습니다!' };
  };

  const overall = getOverallStatus();

  const getNotiStyle = (severity, type) => {
    switch (severity) {
      case 'critical': return { icon: <MdErrorOutline />, className: 'danger' };
      case 'warning': return { icon: <MdWarningAmber />, className: 'warning' };
      case 'info':
      default: return { icon: type === 'light' ? <MdOutlineTipsAndUpdates /> : <MdInfoOutline />, className: 'tip' };
    }
  };

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-header flex-header">
        <div className="header-title-group">
          <div className="custom-select-wrapper">
            <select className="pot-dropdown" value={activePot.id} onChange={handleDropdownChange}>
              {potList.map((pot) => (
                <option key={pot.id} value={pot.id}>{pot.potName}</option>
              ))}
              <option value="add_new" style={{ fontWeight: 'bold', color: '#10b981' }}>+ 새 화분 등록</option>
            </select>
            <MdKeyboardArrowDown className="dropdown-arrow-icon" />
          </div>
          <span className="plant-tag"><MdEco /> {activePot.plantType}</span>
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
          optimalRange={activePot.moistureMin !== undefined ? `적정: ${activePot.moistureMin} ~ ${activePot.moistureMax}%` : "적정 정보 없음"} 
          status={moistureStatus.status} badge={moistureStatus.badge} 
        />
        <SensorCard 
          title="온도" value={sensorData.temperature} unit="°C" icon="🌡️" 
          optimalRange={activePot.tempMin !== undefined ? `적정: ${activePot.tempMin} ~ ${activePot.tempMax}°C` : "적정 정보 없음"} 
          status={tempStatus.status} badge={tempStatus.badge} 
        />
        <SensorCard 
          title="주변 습도" value={sensorData.humidity} unit="%" icon="💨" 
          optimalRange={activePot.humidityMin !== undefined ? `적정: ${activePot.humidityMin} ~ ${activePot.humidityMax}%` : "적정 정보 없음"} 
          status={humidityStatus.status} badge={humidityStatus.badge} 
        />
        <SensorCard 
          title="밝기" value={sensorData.illuminance} unit="lx" icon="☀️" 
          optimalRange={activePot.lightMin !== undefined ? `적정: ${activePot.lightMin} ~ ${activePot.lightMax}lx` : "적정 정보 없음"} 
          status={lightStatus.status} badge={lightStatus.badge} 
        />
        <SensorCard 
          title="물탱크 수위" value={sensorData.waterLevel} unit="%" icon="🌊" 
          optimalRange="적정: 20% 이상 유지" 
          status={waterStatus.status} badge={waterStatus.badge} 
        />
      </div>

      <div className="dashboard-bottom-wrapper">
        <div className="ai-alert-panel">
          <h3 className="panel-title">AI 스마트 알림</h3>
          
          <div className="ai-messages-container">
            {loading && notifications.length === 0 ? (
              <p className="loading-text">알림 분석 중...</p>
            ) : (
              (() => {
                const currentPotNotifications = notifications.filter(noti => noti.pot_id === activePot.id);
                
                if (currentPotNotifications.length === 0) {
                  return (
                    <div className="ai-message-card empty">
                      <p>현재 화분에는 분석된 알림이 없습니다.</p>
                    </div>
                  );
                }

                return currentPotNotifications.slice(0, 3).map((noti) => {
                  const style = getNotiStyle(noti.severity, noti.type);
                  
                  // 타입들에 대한 제목 매핑
                  let notiTitle = '식물 건강 가이드';
                  if (noti.type === 'soil_moisture') notiTitle = '토양 수분 이상';
                  else if (noti.type === 'temperature') notiTitle = '온도 이상';
                  else if (noti.type === 'humidity') notiTitle = '주변 습도 이상';
                  else if (noti.type === 'light') notiTitle = '조도 이상';
                  else if (noti.type === 'system') notiTitle = '스마트 시스템 알림'; 
                  
                  return (
                    <div 
                      key={noti.id} 
                      className={`ai-message-card ${style.className}`}
                      style={{ 
                        opacity: noti.is_read ? 0.6 : 1, 
                        cursor: noti.is_read ? 'default' : 'pointer',
                        transition: 'opacity 0.3s',
                        position: 'relative'
                      }}
                      onClick={() => {
                        if (!noti.is_read) {
                          useNotificationStore.getState().markAsRead(noti.id);
                        }
                      }}
                    >
                      <div className="ai-icon">{style.icon}</div>
                      <div className="ai-content">
                        <strong>{notiTitle}</strong>
                        <p>{noti.message}</p>
                        <span className="ai-time">{timeAgo(noti.created_at)}</span>
                      </div>
                      {!noti.is_read && (
                        <div style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', position: 'absolute', top: '16px', right: '16px' }} />
                      )}
                    </div>
                  );
                });
              })()
            )}
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

      {renderAddPotModal()}
    </div>
  );
}

export default DashboardPage;