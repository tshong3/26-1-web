import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdRefresh } from "react-icons/md";
import './AnalysisPage.css';

// 차트를 그리기 위한 더미 시계열 데이터
const mockChartData = [
  { time: '오후 05:27', moisture: 58, temperature: 24.2, humidity: 68 },
  { time: '오후 05:37', moisture: 65, temperature: 23.5, humidity: 64 },
  { time: '오후 05:47', moisture: 46, temperature: 22.8, humidity: 63 },
  { time: '오후 05:57', moisture: 66, temperature: 23.4, humidity: 68 },
  { time: '오후 06:07', moisture: 48, temperature: 24.1, humidity: 58 },
  { time: '오후 06:17', moisture: 62, temperature: 23.5, humidity: 66 },
  { time: '오후 06:27', moisture: 51, temperature: 23.8, humidity: 56 },
  { time: '오후 06:37', moisture: 58, temperature: 23.0, humidity: 59 },
  { time: '오후 06:47', moisture: 52, temperature: 23.3, humidity: 56 },
  { time: '오후 06:57', moisture: 62, temperature: 23.0, humidity: 58 },
];

function AnalysisPage() {
  // 현재 선택된 탭을 관리하는 상태('all', 'moisture', 'temperature', 'humidity')
  const [activeTab, setActiveTab] = useState('all');

  // 탭에 따라 보여줄 제목과 권장 범위를 결정하는 함수
  const getChartInfo = () => {
    switch (activeTab) {
      case 'moisture': return { title: '토양 습도 변화', range: '권장 범위: 40-70%' };
      case 'temperature': return { title: '온도 변화', range: '권장 범위: 18-26°C' };
      case 'humidity': return { title: '주변 습도 변화', range: '권장 범위: 50-70%' };
      default: return { title: '통합 센서 데이터', range: '' };
    }
  };

  const chartInfo = getChartInfo();

  return (
    <div className="analysis-container">
      {/* 상단 헤더 영역 */}
      <div className="analysis-header">
        <div>
          <h2>데이터 분석</h2>
          <p>센서 데이터의 시간별 변화 추이</p>
        </div>
        <button className="refresh-btn">
          <MdRefresh className="refresh-icon" /> 실시간 업데이트
        </button>
      </div>

      {/* 탭 메뉴 영역 */}
      <div className="tab-menu">
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>전체 데이터</button>
        <button className={`tab-btn ${activeTab === 'moisture' ? 'active' : ''}`} onClick={() => setActiveTab('moisture')}>토양 습도</button>
        <button className={`tab-btn ${activeTab === 'temperature' ? 'active' : ''}`} onClick={() => setActiveTab('temperature')}>온도</button>
        <button className={`tab-btn ${activeTab === 'humidity' ? 'active' : ''}`} onClick={() => setActiveTab('humidity')}>주변 습도</button>
      </div>

      {/* 차트 표시 영역 */}
      <div className="chart-card">
        <h3 className="chart-title">{chartInfo.title}</h3>
        
        <div className="chart-wrapper">
          {/* ResponsiveContainer: 화면 크기에 맞춰 차트 크기 자동 조절 */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
              <XAxis dataKey="time" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {/* 조건부 렌더링: 탭에 따라 선을 다르게 보여줌 */}
              {(activeTab === 'all' || activeTab === 'moisture') && 
                <Line type="monotone" dataKey="moisture" name="토양 습도 (%)" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'temperature') && 
                <Line type="monotone" dataKey="temperature" name="온도 (°C)" stroke="#fb923c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'humidity') && 
                <Line type="monotone" dataKey="humidity" name="주변 습도 (%)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 권장 범위 정보 박스(전체 탭이 아닐 때만 보임) */}
        {activeTab !== 'all' && (
          <div className="recommend-range-box">
            {chartInfo.range}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;