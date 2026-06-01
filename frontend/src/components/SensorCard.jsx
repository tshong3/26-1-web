import React from 'react';
import './SensorCard.css';

function SensorCard({ title, value, unit, badge, status = 'normal', optimalRange }) {
  let maxValue = 100;
  if (unit === 'lx') maxValue = 10000;
  else if (unit === '°C') maxValue = 50;

  const progressPercent = Math.min(100, Math.max(0, (Number(value) / maxValue) * 100));

  return (
    <div className={`sensor-card ${status}`}>
      <div className="sensor-header">
        <span className="sensor-title-text">{title}</span>
        {badge && <span className="sensor-badge">{badge}</span>}
      </div>

      <div className="sensor-content">
        <div className="sensor-body">
          <h3 className="sensor-value">
            {value}<span className="sensor-unit">{unit}</span>
          </h3>
        </div>
        {optimalRange && <div className="sensor-optimal-range">{optimalRange}</div>}
      </div>

      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>
    </div>
  );
}

export default SensorCard;