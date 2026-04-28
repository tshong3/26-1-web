// src/components/SensorCard.jsx
import React from 'react';
import './SensorCard.css';

// 💡 badge 속성 추가
function SensorCard({ title, value, unit, icon, badge }) {
  return (
    <div className="sensor-card">
      {/* 카드 상단 (아이콘, 제목, 배지) */}
      <div className="sensor-header">
        <div className="sensor-title-wrapper">
          <span className="sensor-icon">{icon}</span>
          <span className="sensor-title">{title}</span>
        </div>
        {/* badge 데이터가 있을 때만 노란색 배지를 보여줍니다 */}
        {badge && <span className="sensor-badge">{badge}</span>}
      </div>

      {/* 카드 중앙 (수치) */}
      <div className="sensor-body">
        <h3 className="sensor-value">
          {value}<span className="sensor-unit">{unit}</span>
        </h3>
      </div>

      {/* 카드 하단 (프로그레스 바) */}
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