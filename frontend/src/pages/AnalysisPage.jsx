import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Brush, ReferenceArea 
} from 'recharts';
import { MdRefresh } from "react-icons/md";
import './AnalysisPage.css';

const generateMockData = () => {
  const data = [];
  for (let i = 0; i <= 24; i++) {
    data.push({
      time: `${i}시간 전`,
      moisture: Math.floor(Math.random() * 50) + 20, // 20~70%
      temperature: Math.floor(Math.random() * 15) + 15, // 15~30°C
      humidity: Math.floor(Math.random() * 40) + 40, // 40~80%
    });
  }
  return data.reverse(); // 최신 시간이 오른쪽으로
};

const mockChartData = generateMockData();

function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('moisture'); // 기본 탭 토양 습도
  const [timeRange, setTimeRange] = useState('day'); // 기간 선택 상태

  const getChartInfo = () => {
    switch (activeTab) {
      case 'moisture': return { title: '토양 습도 변화', safeMin: 30, safeMax: 70, unit: '%' };
      case 'temperature': return { title: '온도 변화', safeMin: 18, safeMax: 26, unit: '°C' };
      case 'humidity': return { title: '주변 습도 변화', safeMin: 40, safeMax: 70, unit: '%' };
      default: return { title: '통합 센서 데이터', safeMin: null, safeMax: null, unit: '' };
    }
  };

  const chartInfo = getChartInfo();

  // 데이터가 너무 많을 때 가장 최근 10개 데이터만 처음 화면에 보여줌
  const startIndex = Math.max(mockChartData.length - 10, 0);

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <div>
          <h2>데이터 분석</h2>
          <p>식물의 상태 변화를 확인할 수 있어요</p>
        </div>
        <button className="refresh-btn">
          <MdRefresh className="refresh-icon" /> 실시간 업데이트
        </button>
      </div>

      {/* 조회 기간 선택 필터 */}
      <div className="filter-controls">
        <div className="tab-menu">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>전체 보기</button>
          <button className={`tab-btn ${activeTab === 'moisture' ? 'active' : ''}`} onClick={() => setActiveTab('moisture')}>토양 습도</button>
          <button className={`tab-btn ${activeTab === 'temperature' ? 'active' : ''}`} onClick={() => setActiveTab('temperature')}>온도</button>
          <button className={`tab-btn ${activeTab === 'humidity' ? 'active' : ''}`} onClick={() => setActiveTab('humidity')}>주변 습도</button>
        </div>

        <div className="time-range-menu">
          <button className={`range-btn ${timeRange === 'day' ? 'active' : ''}`} onClick={() => setTimeRange('day')}>1일</button>
          <button className={`range-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>1주</button>
          <button className={`range-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>1개월</button>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-title">{chartInfo.title}</h3>
          {/* 정상 범위 안내 뱃지 */}
          {activeTab !== 'all' && (
            <span className="safe-range-badge">
              적정 범위: {chartInfo.safeMin} ~ {chartInfo.safeMax}{chartInfo.unit}
            </span>
          )}
        </div>
        
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
              <XAxis dataKey="time" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={40} />
              
              {/* 정상 범위 배경 칠하기 */}
              {activeTab !== 'all' && chartInfo.safeMin !== null && (
                <ReferenceArea 
                  y1={chartInfo.safeMin} 
                  y2={chartInfo.safeMax} 
                  fill="#10b981"
                  fillOpacity={0.08}
                />
              )}

              {/* 데이터 선 */}
              {(activeTab === 'all' || activeTab === 'moisture') && 
                <Line type="monotone" dataKey="moisture" name="토양 습도 (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'temperature') && 
                <Line type="monotone" dataKey="temperature" name="온도 (°C)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'humidity') && 
                <Line type="monotone" dataKey="humidity" name="주변 습도 (%)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              
              {/* 하단 가로 스크롤바 */}
              <Brush 
                dataKey="time" 
                height={30} 
                stroke="#d1d5db" 
                fill="#f9fafb"
                travellerWidth={10}
                startIndex={startIndex} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;