// src/components/SensorCard.jsx
import React from 'react';
import './SensorCard.css';

function SensorCard({ title, value, unit, icon, badge, status = 'normal', optimalRange }) {
  return (
    <div className={`sensor-card ${status}`}>
      <div className="sensor-header">
        <div className="sensor-title-wrapper">
          <span className="sensor-icon">{icon}</span>
          <span className="sensor-title">{title}</span>
        </div>
        {badge && <span className="sensor-badge">{badge}</span>}
      </div>

      {/* 💡 숫자와 적정 범위를 하나의 묶음(content)으로 감싸줍니다. */}
      <div className="sensor-content">
        <div className="sensor-body">
          <h3 className="sensor-value">
            {value}<span className="sensor-unit">{unit}</span>
          </h3>
        </div>
        
        {/* 💡 optimalRange 값이 전달된 카드에만 적정 범위 텍스트를 보여줍니다. */}
        {optimalRange && (
          <div className="sensor-optimal-range">
            {optimalRange}
          </div>
        )}
      </div>

      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${value > 100 ? 100 : value}%` }} 
        ></div>
      </div>
    </div>
  );
}

export default SensorCard;