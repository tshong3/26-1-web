import React, { useState, useEffect } from 'react';
import useSensorStore from '../store/useSensorStore';
import { MdWaterDrop, MdOutlineSettingsBackupRestore, MdKeyboardArrowDown } from "react-icons/md"; 
import './ControlPage.css';

function ControlPage() {
  const { 
    sensorData, 
    controlSettings, 
    updateControlSettings, 
    updateSensorData, 
    potList,
    activePotId, 
    setActivePotId,
    fetchWateringSettings, 
    saveWateringSettings, 
    runManualWatering, 
    fetchWateringLogs, 
    fetchLatestSensorData,
    addPot,
    nickname
  } = useSensorStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPotName, setNewPotName] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');

  const [isAutoMode, setIsAutoMode] = useState(controlSettings.isAutoMode || false);
  const [threshold, setThreshold] = useState(controlSettings.autoWateringThreshold || 30);
  const [isScheduleMode, setIsScheduleMode] = useState(controlSettings.isScheduleMode || false);
  const [scheduleTime, setScheduleTime] = useState(controlSettings.scheduleTime || '08:00');
  const [duration, setDuration] = useState(controlSettings.wateringDuration || 15);
  const initialPeriodStr = controlSettings.schedulePeriod || '1일';
  const initValue = parseInt(initialPeriodStr) || 1;
  const initUnit = initialPeriodStr.includes('주') ? '주' : '일';
  const [scheduleValue, setScheduleValue] = useState(initValue);
  const [scheduleUnit, setScheduleUnit] = useState(initUnit);
  const [periodError, setPeriodError] = useState('');
  const [manualDuration, setManualDuration] = useState(15);

  const handleSaveSettings = async () => {
    updateControlSettings({
      isAutoMode,
      autoWateringThreshold: threshold,
      isScheduleMode,
      schedulePeriod: `${scheduleValue || 1}${scheduleUnit}`,
      scheduleTime,
      wateringDuration: duration,
    });

    if(!activePotId){
      alert('선택된 화분이 없습니다.');
      return;
    }

    const result = await saveWateringSettings(activePotId);
    if(result.success){
      alert('급수 설정이 저장되었습니다.');
    }else{
      alert(result.message||'급수 설정 저장에 실패했습니다.');
    }
  };

  const handleManualWatering = async() => {
    if(!activePotId){
      alert('선택된 화분이 없습니다.');
      return;
    }

    updateControlSettings({wateringDuration: manualDuration});

    const result = await runManualWatering(activePotId);
    if(result.success){
      alert(`수동 급수를 시작합니다.`);
      await fetchWateringLogs(activePotId);
      await fetchLatestSensorData(activePotId);
    }else{
      alert(result.message||'수동 급수에 실패했습니다.')
    }
  };

  const handleWaterRefill = () => {
    updateSensorData({ waterLevel: 100 });
    alert('물탱크가 가득 채워졌습니다.');
  };

  const handleDropdownChange = (e) => {
    const value = e.target.value;
    if (value === 'add_new') setIsModalOpen(true);
    else setActivePotId(Number(value));
  };

  const handleAddPot = (e) => {
    e.preventDefault();
    if (potList.some((pot) => pot.potName === newPotName)) return alert('이미 존재하는 화분 이름입니다.');
    if (!newDeviceId.trim() || newDeviceId.length < 4) return alert('올바른 등록 PIN(최소 4자리 이상)을 입력해 주세요.');
    addPot({ potName: newPotName, plantName: newPlantName, deviceId: newDeviceId });
    alert('화분이 등록되었습니다!');
    setIsModalOpen(false);
    setNewPotName(''); setNewPlantName(''); setNewDeviceId('');
  };

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
            <button type="submit" className="btn-primary-large" style={{ width: '100%', marginTop: '16px' }}>등록하기</button>
          </form>
        </div>
      </div>
    )
  );

  const isDurationEnabled = isAutoMode || isScheduleMode;

  useEffect(() => {
    if (!activePotId) return;

    (async () => {
      const result = await fetchWateringSettings(activePotId);
      if (result.success) {
        const data = result.data;
        setIsAutoMode(data.auto_enabled);
        setIsScheduleMode(data.schedule_enabled);
        setThreshold(data.min_soil_moisture);
        setDuration(Math.round((data.duration_ms || 15000) / 1000));
        setScheduleTime(data.watering_time?.slice(0, 5) || '08:00');
      }
      await fetchWateringLogs(activePotId);
      await fetchLatestSensorData(activePotId);
    })();
  }, [activePotId, fetchWateringSettings, fetchWateringLogs, fetchLatestSensorData]);

  if (potList.length === 0) {
    return (
      <div className="control-container empty-state" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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

  return (
    <div className="control-container">
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
          <span className="plant-tag">🌿 {activePot.plantName || activePot.plantType}</span>
        </div>
        <p>급수 시스템을 설정하고 수동으로 물을 줄 수 있습니다.</p>
      </div>

      <div className="control-panels-wrapper">
        <div className="control-card">
          <div className="card-title-group">
            <h3>자동 급수</h3>
          </div>
          <p className="card-desc" style={{ marginBottom: '24px' }}>식물의 상태와 시간에 맞춰 자동으로 물을 공급합니다.</p>

          <div className={`inner-setting-card ${isAutoMode ? 'active' : ''}`}>
            <div className="inner-card-header">
              <div className="inner-title-area">
                <span className="icon-circle auto-icon">🍃</span>
                <div>
                  <h4>자동 급수 설정</h4>
                  <p>토양 습도가 기준 이하일 때 자동으로 급수합니다.</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={isAutoMode} onChange={(e) => setIsAutoMode(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className={`inner-card-content ${!isAutoMode ? 'disabled' : ''}`}>
              <div className="input-row between">
                <label>토양 습도 조건</label>
                <div className="input-with-text">
                  <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} disabled={!isAutoMode} />
                  <span>% 이하일 때 작동</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`inner-setting-card ${isScheduleMode ? 'active' : ''}`}>
            <div className="inner-card-header">
              <div className="inner-title-area">
                <span className="icon-circle schedule-icon">📅</span>
                <div>
                  <h4>예약 급수 설정</h4>
                  <p>정해진 주기와 시간에 맞춰 급수합니다.</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={isScheduleMode} onChange={(e) => setIsScheduleMode(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className={`inner-card-content ${!isScheduleMode ? 'disabled' : ''}`}>
              <div className="input-row between" style={{ marginBottom: '16px', alignItems: 'flex-start' }}>
                <label style={{ marginTop: '12px' }}>주기</label>
                <div className="period-input-wrapper">
                  <div className="custom-period-input">
                    <input 
                      type="number" 
                      className={periodError ? 'error-border' : ''}
                      value={scheduleValue} 
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.startsWith('0')) {
                          setPeriodError('1부터 입력할 수 있습니다.');
                          return;
                        }
                        setPeriodError('');
                        if (val.length > 2) val = val.slice(0, 2); 
                        setScheduleValue(val === '' ? '' : parseInt(val));
                      }}
                      onBlur={() => {
                        setPeriodError('');
                        if (!scheduleValue || scheduleValue < 1) setScheduleValue(1);
                      }}
                      disabled={!isScheduleMode}
                      min="1"
                      max="99"
                    />
                    <select 
                      value={scheduleUnit} 
                      onChange={(e) => setScheduleUnit(e.target.value)} 
                      disabled={!isScheduleMode}
                    >
                      <option value="일">일</option>
                      <option value="주">주</option>
                    </select>
                    <span className="period-suffix">마다</span>
                  </div>
                  {periodError && <div className="error-text">{periodError}</div>}
                </div>
              </div>
              <div className="input-row between">
                <label>시간</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} disabled={!isScheduleMode} />
              </div>
            </div>
          </div>

          <div className={`inner-setting-card ${!isDurationEnabled ? 'disabled' : ''}`}>
            <div className="inner-card-header no-border">
              <div className="inner-title-area">
                <span className="icon-circle water-icon">💧</span>
                <div>
                  <h4>1회 급수량 설정</h4>
                  <p>급수 1회 실행 시 펌프 작동 시간을 설정합니다.</p>
                </div>
              </div>
            </div>
            <div className="inner-card-content no-border">
               <div className="input-row center">
                <div className="input-with-text large">
                  <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={!isDurationEnabled} />
                  <span>초 동안 펌프 가동</span>
                </div>
              </div>
            </div>
          </div>

          <button className="btn-save" onClick={handleSaveSettings}>
            <span style={{ marginRight: '6px' }}>💧</span> 저장
          </button>
        </div>

        <div className="right-column-wrapper">
          <div className="control-card manual-card">
            <div className="card-title-group">
              <h3>수동 급수</h3>
              <span className="badge">실행</span>
            </div>
            <p className="card-desc">지금 바로 식물에 물을 공급합니다.</p>
            <div className="setting-group highlight" style={{ marginBottom: '24px' }}>
              <div className="setting-header"><label>급수량 설정</label></div>
              <div className="input-row">
                <input type="number" value={manualDuration} onChange={(e) => setManualDuration(Number(e.target.value))} min="1" />
                <span>초 동안 펌프 가동</span>
              </div>
            </div>
            <button className="btn-water-now" onClick={handleManualWatering}><MdWaterDrop /> 급수 시작</button>
          </div>

          <div className="control-card status-card">
            <div className="card-title-group">
              <h3>실시간 모니터링</h3>
            </div>
            <p className="card-desc">수동 급수 전 현재 상태를 확인하세요.</p>
            
            <div className="status-box">
              <div className="status-info-text">
                <span>토양 습도</span>
                <span className={`status-percent ${sensorData.soilMoisture < 30 ? 'danger' : 'moisture'}`}>
                  {sensorData.soilMoisture}%
                </span>
              </div>
              <div className="status-progress-bar">
                <div 
                  className={`status-progress-fill ${sensorData.soilMoisture < 30 ? 'danger' : 'moisture'}`} 
                  style={{ width: `${sensorData.soilMoisture}%` }}
                ></div>
              </div>
              <p className="status-hint">
                {sensorData.soilMoisture < 30 ? '⚠️ 건조합니다. 물이 필요해요.' : '✅ 수분이 충분한 상태입니다.'}
              </p>
            </div>

            <div className="status-box">
              <div className="status-info-text">
                <span>물탱크 수위</span>
                <span className={`status-percent ${sensorData.waterLevel <= 20 ? 'danger' : 'water'}`}>
                  {sensorData.waterLevel}%
                </span>
              </div>
              <div className="status-progress-bar">
                <div 
                  className={`status-progress-fill ${sensorData.waterLevel <= 20 ? 'danger' : 'water'}`} 
                  style={{ width: `${sensorData.waterLevel}%` }}
                ></div>
              </div>
              <p className="status-hint">
                {sensorData.waterLevel <= 20 ? '⚠️ 물을 보충해 주세요.' : '✅ 펌프 작동이 가능합니다.'}
              </p>
            </div>

            <button className="btn-refill" onClick={handleWaterRefill}>
              <MdOutlineSettingsBackupRestore /> 물 보충 완료
            </button>
          </div>
        </div>

      </div>
      {renderAddPotModal()}
    </div>
  );
}

export default ControlPage;