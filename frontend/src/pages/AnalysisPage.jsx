import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Brush, ReferenceArea 
} from 'recharts';
import { MdRefresh, MdKeyboardArrowDown } from "react-icons/md";
import useSensorStore from '../store/useSensorStore';
import { sensorService } from '../services/sensorService';
import './AnalysisPage.css';

function AnalysisPage() {
  const { 
    potList, activePotId, setActivePotId, addPot, nickname,
    plantGuide, fetchPlantGuide
  } = useSensorStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPotName, setNewPotName] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState(null);

  const [activeTab, setActiveTab] = useState('moisture'); 
  const [timeRange, setTimeRange] = useState('hour'); 
  
  const [chartData, setChartData] = useState([]); 

  const fetchChartData = async () => {
    if (!activePotId) return;
    try {
      const res = await sensorService.getChart(activePotId, timeRange);
      if (res.success) {
        setChartData(res.data.items);
      }
    } catch (error) {
      console.error('차트 데이터 로드 실패:', error);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [activePotId, timeRange]);

  useEffect(() => {
    fetchPlantGuide();
  }, [fetchPlantGuide]);

  const handleDropdownChange = (e) => {
    const value = e.target.value;
    if (value === 'add_new') setIsModalOpen(true);
    else setActivePotId(Number(value));
  };

  const handleAddPot = async (e) => {
    e.preventDefault();
    if (!newPotName.trim()) return alert('화분 이름을 입력해 주세요.');
    if (!newDeviceId.trim()) return alert('올바른 PIN을 입력해 주세요.');
    
    let finalPlantId = selectedPlantId;
    if (!finalPlantId) {
      const exactMatch = plantGuide.find(p => p.name === newPlantName);
      if (exactMatch) {
        finalPlantId = exactMatch.id;
      } else {
        return alert('식물 종류를 선택해 주세요.');
      }
    }

    const result = await addPot({ 
      potName: newPotName, 
      plantId: finalPlantId, 
      deviceId: newDeviceId 
    });

    if (result.success) {
      alert('화분이 등록되었어요.');
      setIsModalOpen(false);
      setNewPotName(''); setNewPlantName(''); setNewDeviceId(''); setSelectedPlantId(null);
    } else {
      alert(result.message || '화분 등록에 실패했어요.');
    }
  };

  const filteredPlants = plantGuide.filter(plant => plant.name.includes(newPlantName));

  const renderAddPotModal = () => (
    isModalOpen && (
      <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setIsDropdownOpen(false); }}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>새 화분 등록</h3>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
          </div>
          <form onSubmit={handleAddPot} className="add-pot-form">
            <div className="input-group">
              <label>화분 이름</label>
              <input type="text" placeholder="예: 거실 화분" value={newPotName} onChange={(e) => setNewPotName(e.target.value)} required />
            </div>
            
            <div className="input-group">
              <label>식물 종류</label>
              <div className="autocomplete-wrapper">
                <input 
                  type="text" placeholder="예: 장미" value={newPlantName} 
                  onChange={(e) => {
                    setNewPlantName(e.target.value);
                    setIsDropdownOpen(true);
                    setSelectedPlantId(null); 
                  }} 
                  onFocus={() => setIsDropdownOpen(true)}
                  required 
                />
                {isDropdownOpen && newPlantName && filteredPlants.length > 0 && (
                  <ul className="autocomplete-dropdown">
                    {filteredPlants.map((plant) => (
                      <li key={plant.id} className="autocomplete-item" onClick={() => {
                        setNewPlantName(plant.name);
                        setSelectedPlantId(plant.id);
                        setIsDropdownOpen(false);
                      }}>
                        {plant.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>등록 PIN</label>
              <input type="text" placeholder="기기 PIN 입력" value={newDeviceId} onChange={(e) => setNewDeviceId(e.target.value)} required />
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
  const startIndex = Math.max(chartData.length - 10, 0);

  if (potList.length === 0) {
    return (
      <div className="analysis-container empty-state">
        <div className="empty-icon" style={{ fontSize: '60px', marginBottom: '20px' }}>🪴</div>
        <h2 style={{ color: '#0f172a', margin: '0 0 16px 0' }}>등록된 화분이 없어요</h2>
        <p style={{ color: '#64748b', margin: '0 0 30px 0' }}>{nickname}님의 식물을 등록하고 스마트하게 관리해보세요</p>
        <button className="btn-primary-large" onClick={() => setIsModalOpen(true)}>+ 새 화분 등록하기</button>
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
            <span className="plant-tag">🪴 {activePot.plantName || activePot.plantType}</span>
          </div>
          <p>식물의 상태 변화를 확인할 수 있어요</p>
        </div>
        <button className="refresh-btn" onClick={fetchChartData}>
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
          <button className={`range-btn ${timeRange === 'hour' ? 'active' : ''}`} onClick={() => setTimeRange('hour')}>1일</button>
          <button className={`range-btn ${timeRange === 'day' ? 'active' : ''}`} onClick={() => setTimeRange('day')}>1달</button>
          <button className={`range-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>1년</button>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-title">{chartInfo.title}</h3>
          {activeTab !== 'all' && (
            <span className="safe-range-badge">적정 범위: {chartInfo.safeMin} ~ {chartInfo.safeMax}{chartInfo.unit}</span>
          )}
        </div>
        
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
              <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
              <Legend verticalAlign="top" height={40} />
              
              {activeTab !== 'all' && chartInfo.safeMin !== null && (
                <ReferenceArea y1={chartInfo.safeMin} y2={chartInfo.safeMax} fill="#10b981" fillOpacity={0.08} />
              )}

              {(activeTab === 'all' || activeTab === 'moisture') && 
                <Line type="monotone" dataKey="soil_moisture" name="토양 습도 (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'temperature') && 
                <Line type="monotone" dataKey="temperature" name="온도 (°C)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'humidity') && 
                <Line type="monotone" dataKey="humidity" name="주변 습도 (%)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              
              <Brush dataKey="label" height={30} stroke="#d1d5db" fill="#f9fafb" travellerWidth={10} startIndex={startIndex} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {renderAddPotModal()}
    </div>
  );
}

export default AnalysisPage;