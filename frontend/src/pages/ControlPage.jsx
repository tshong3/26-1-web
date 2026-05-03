import React, { useState } from 'react';
import useSensorStore from '../store/useSensorStore';
import './ControlPage.css';

function ControlPage() {
  const { controlSettings, updateControlSettings, addWateringHistory } = useSensorStore();

  // 자동화 폼 상태 관리
  const [isAutoMode, setIsAutoMode] = useState(controlSettings.isAutoMode);
  const [threshold, setThreshold] = useState(controlSettings.autoWateringThreshold);
  const [duration, setDuration] = useState(controlSettings.wateringDuration);
  const [isScheduleMode, setIsScheduleMode] = useState(controlSettings.isScheduleMode);
  const [scheduleTime, setScheduleTime] = useState(controlSettings.scheduleTime);
  const [manualDuration, setManualDuration] = useState(15);

  // 저장 버튼 클릭
  const handleSaveSettings = () => {
    updateControlSettings({
      isAutoMode,
      autoWateringThreshold: threshold,
      wateringDuration: duration,
      isScheduleMode,
      scheduleTime
    });
    alert('자동 급수 설정이 저장되었습니다.');
  };

  // 수동 급수
  const handleManualWatering = () => {
    alert(`수동 급수를 시작합니다.`);
    addWateringHistory('수동 급수', `${manualDuration}초`);
  };

  return (
    <div className="control-container">
      <div className="control-header">
        <h2>급수 시스템</h2>
        <p>식물의 특성에 맞게 급수 조건을 설정할 수 있습니다</p>
      </div>

      <div className="control-panels-wrapper">
        
        {/* 1. 자동화 상세 설정 패널 */}
        <div className="control-card auto-card">
          <div className="card-title-group">
            <h3>자동 급수 설정</h3>
            <label className="toggle-switch">
              <input type="checkbox" checked={isAutoMode} onChange={(e) => setIsAutoMode(e.target.checked)} />
              <span className="slider round"></span>
            </label>
          </div>
          <p className="card-desc">식물에 자동으로 급수를 합니다.</p>

          <div className={`settings-form ${!isAutoMode ? 'disabled' : ''}`}>
            
            {/* 조건 1: 토양 수분 기준 */}
            <div className="setting-group">
              <div className="setting-header">
                <label>토양 수분 조건 설정</label>
              </div>
              <div className="input-row">
                <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} disabled={!isAutoMode} />
                <span>% 이하일 때 작동</span>
              </div>
            </div>

            {/* 조건 2: 시간 스케줄링 */}
            <div className="setting-group">
              <div className="setting-header">
                <label>시간 설정</label>
                <label className="toggle-switch small">
                  <input type="checkbox" checked={isScheduleMode} onChange={(e) => setIsScheduleMode(e.target.checked)} disabled={!isAutoMode} />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className={`input-row ${!isScheduleMode ? 'disabled' : ''}`}>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} disabled={!isAutoMode || !isScheduleMode} />
                <span>에 자동으로 작동</span>
              </div>
            </div>

            {/* 조건 3: 급수량 설정 */}
            <div className="setting-group highlight">
              <div className="setting-header">
                <label>1회 급수량 설정</label>
              </div>
              <div className="input-row">
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={!isAutoMode} />
                <span>초 동안 펌프 가동</span>
              </div>
            </div>

            <button className="btn-save" onClick={handleSaveSettings} disabled={!isAutoMode}>
              저장
            </button>
          </div>
        </div>

        {/* 2. 수동 제어 패널 */}
        <div className="control-card manual-card">
          <div className="card-title-group">
            <h3>수동 급수</h3>
            <span className="badge">즉시 실행</span>
          </div>
          <p className="card-desc">지금 바로 식물에 물을 공급합니다.</p>
          
          {/* 수동 급수량 설정 */}
          <div className="setting-group highlight" style={{ marginBottom: '24px' }}>
            <div className="setting-header">
              <label>급수량 설정</label>
            </div>
            <div className="input-row">
              <input 
                type="number" 
                value={manualDuration} 
                onChange={(e) => setManualDuration(Number(e.target.value))} 
                min="1"
              />
              <span>초 동안 펌프 가동</span>
            </div>
          </div>

          <button className="btn-water-now" onClick={handleManualWatering}>
            <span className="water-icon">💧</span> 급수 시작
          </button>
        </div>

      </div>
    </div>
  );
}

export default ControlPage;