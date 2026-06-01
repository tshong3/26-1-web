import React from 'react';
import './SensorCard.css';

function SensorCard({ title, value, unit, icon, badge, status = 'normal', optimalRange }) {
  
  // 단위에 따라 상태바의 최댓값을 다르게 설정
  let maxValue = 100; // 기본 최댓값
  if (unit === 'lx') {
    maxValue = 10000; // 밝기의 최댓값은 10000
  } else if (unit === '°C') {
    maxValue = 50; // 온도의 최댓값은 50도
  }

  const progressPercent = Math.min(100, Math.max(0, (Number(value) / maxValue) * 100));

  return (
    <div className={`sensor-card ${status}`}>
      <div className="sensor-header">
        <div className="sensor-title-wrapper">
          <span className="sensor-icon">{icon}</span>
          <span className="sensor-title">{title}</span>
        </div>
        {badge && <span className="sensor-badge">{badge}</span>}
      </div>

      <div className="sensor-content">
        <div className="sensor-body">
          <h3 className="sensor-value">
            {value}<span className="sensor-unit">{unit}</span>
          </h3>
        </div>
        
        {optimalRange && (
          <div className="sensor-optimal-range">
            {optimalRange}
          </div>
        )}
      </div>

      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progressPercent}%` }} 
        ></div>
      </div>
    </div>
  );
}

export default SensorCard;