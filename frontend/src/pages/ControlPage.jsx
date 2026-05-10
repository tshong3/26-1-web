import React, { useState } from 'react';
import useSensorStore from '../store/useSensorStore';
import { MdWaterDrop, MdOutlineSettingsBackupRestore } from "react-icons/md"; 
import './ControlPage.css';

function ControlPage() {
  const { sensorData, controlSettings, updateControlSettings, addWateringHistory, updateSensorData } = useSensorStore();
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

  const handleSaveSettings = () => {
    updateControlSettings({
      isAutoMode,
      autoWateringThreshold: threshold,
      isScheduleMode,
      schedulePeriod: `${scheduleValue || 1}${scheduleUnit}`,
      scheduleTime,
      wateringDuration: duration,
    });
    alert('급수 설정이 저장되었습니다.');
  };

  const handleManualWatering = () => {
    alert(`수동 급수를 시작합니다.`);
    addWateringHistory('수동 급수', `${manualDuration}초`);
  };

  const handleWaterRefill = () => {
    updateSensorData({ waterLevel: 100 });
    alert('물탱크가 가득 채워졌습니다.');
  };

  const isDurationEnabled = isAutoMode || isScheduleMode;

  return (
    <div className="control-container">
      <div className="control-header">
        <h2>급수 시스템</h2>
        <p>자동 급수를 설정할 수 있습니다</p>
      </div>

      <div className="control-panels-wrapper">
        
        {/* 자동 급수 설정 패널 */}
        <div className="control-card">
          <div className="card-title-group">
            <h3>자동 급수</h3>
          </div>
          <p className="card-desc" style={{ marginBottom: '24px' }}>식물의 상태와 시간에 맞춰 자동으로 물을 공급합니다.</p>

          {/* 자동 급수 설정 */}
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

          {/* 예약 급수 설정 */}
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
                
                {/* 입력 영역과 에러 메시지를 묶어주는 래퍼 */}
                <div className="period-input-wrapper">
                  <div className="custom-period-input">
                    <input 
                      type="number" 
                      className={periodError ? 'error-border' : ''}
                      value={scheduleValue} 
                      onChange={(e) => {
                        let val = e.target.value;
                        
                        // 0부터 입력 불가
                        if (val.startsWith('0')) {
                          setPeriodError('1부터 입력할 수 있습니다.');
                          return;
                        }

                        // 정상 입력 시 에러 초기화
                        setPeriodError('');

                        if (val.length > 2) val = val.slice(0, 2); 
                        setScheduleValue(val === '' ? '' : parseInt(val));
                      }}
                      onBlur={() => {
                        // 포커스를 잃을 때 에러 지우고 1로 복구
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
                  {/* 에러 메시지가 있을 때만 노출 */}
                  {periodError && <div className="error-text">{periodError}</div>}
                </div>

              </div>
              <div className="input-row between">
                <label>시간</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} disabled={!isScheduleMode} />
              </div>
            </div>
          </div>

          {/* 1회 급수량 설정 */}
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

        {/* 수동 급수, 실시간 모니터링 */}
        <div className="right-column-wrapper">
          {/* 수동 급수 패널 */}
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

          {/* 실시간 상태 모니터링 패널 */}
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
    </div>
  );
}

export default ControlPage;