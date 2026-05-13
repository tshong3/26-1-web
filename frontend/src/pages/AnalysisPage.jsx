import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Brush, ReferenceArea 
} from 'recharts';
import { MdRefresh, MdKeyboardArrowDown } from "react-icons/md";
import useSensorStore from '../store/useSensorStore';
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
  const { 
    potList, 
    activePotId, 
    setActivePotId,
    addPot,
    nickname
  } = useSensorStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPotName, setNewPotName] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');

  const [activeTab, setActiveTab] = useState('moisture'); 
  const [timeRange, setTimeRange] = useState('day'); 

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

  const getChartInfo = () => {
    switch (activeTab) {
      case 'moisture': return { title: '토양 습도 변화', safeMin: 30, safeMax: 70, unit: '%' };
      case 'temperature': return { title: '온도 변화', safeMin: 18, safeMax: 26, unit: '°C' };
      case 'humidity': return { title: '주변 습도 변화', safeMin: 40, safeMax: 70, unit: '%' };
      default: return { title: '통합 센서 데이터', safeMin: null, safeMax: null, unit: '' };
    }
  };

  const chartInfo = getChartInfo();
  const startIndex = Math.max(mockChartData.length - 10, 0);

  if (potList.length === 0) {
    return (
      <div className="analysis-container empty-state" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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
    <div className="analysis-container">
      
      <div className="analysis-header">
        <div>
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
            <span className="plant-tag">📊 {activePot.plantName || activePot.plantType}</span>
          </div>
          <p>식물의 상태 변화를 확인할 수 있어요</p>
        </div>
        <button className="refresh-btn">
          <MdRefresh className="refresh-icon" /> 실시간 업데이트
        </button>
      </div>

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
              
              {activeTab !== 'all' && chartInfo.safeMin !== null && (
                <ReferenceArea 
                  y1={chartInfo.safeMin} 
                  y2={chartInfo.safeMax} 
                  fill="#10b981"
                  fillOpacity={0.08}
                />
              )}

              {(activeTab === 'all' || activeTab === 'moisture') && 
                <Line type="monotone" dataKey="moisture" name="토양 습도 (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'temperature') && 
                <Line type="monotone" dataKey="temperature" name="온도 (°C)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'humidity') && 
                <Line type="monotone" dataKey="humidity" name="주변 습도 (%)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              
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
      {renderAddPotModal()}
    </div>
  );
}

export default AnalysisPage;