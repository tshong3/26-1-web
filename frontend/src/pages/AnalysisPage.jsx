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

  const [activeTab, setActiveTab] = useState('all'); 
  const [timeRange, setTimeRange] = useState('hour'); 
  
  const [chartData, setChartData] = useState([]); 

  const fetchChartData = async () => {
    if (!activePotId) return;
    try {
      const res = await sensorService.getChart(activePotId, timeRange);
      if (res.success) {
        // 💡 API 구조가 items가 아니라 바로 배열로 올 경우를 대비한 강력한 방어 코드
        const incomingData = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        console.log("📊 차트에 들어갈 데이터:", incomingData); // F12 개발자 도구에서 데이터가 제대로 오는지 확인용
        setChartData(incomingData);
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
    const pot = potList.find(p => p.id === activePotId);
    if (!pot) return { title: '통합 센서 데이터', safeMin: null, safeMax: null, unit: '' };

    switch (activeTab) {
      case 'moisture': return { title: '토양 습도 변화', safeMin: pot.moistureMin ?? null, safeMax: pot.moistureMax ?? null, unit: '%' };
      case 'temperature': return { title: '온도 변화', safeMin: pot.tempMin ?? null, safeMax: pot.tempMax ?? null, unit: '°C' };
      case 'humidity': return { title: '주변 습도 변화', safeMin: pot.humidityMin ?? null, safeMax: pot.humidityMax ?? null, unit: '%' };
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
        <div className="analysis-title-wrapper">
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
          {activeTab !== 'all' && chartInfo.safeMin != null && (
            <span className="safe-range-badge">적정 범위: {chartInfo.safeMin} ~ {chartInfo.safeMax}{chartInfo.unit}</span>
          )}
        </div>
        
        <div className="chart-wrapper">
          {/* 💡 높이가 0으로 찌그러지는 현상 방지를 위해 height 400 강제 고정 */}
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
              <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} minTickGap={20} />
              
              <YAxis 
                tick={{ fill: '#888', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
                domain={[
                  (dataMin) => {
                    const min = Number(dataMin);
                    if (!isFinite(min)) return 0;
                    if (activeTab === 'all' || chartInfo.safeMin == null || chartInfo.safeMax == null) {
                      return Math.floor(min - 10);
                    }
                    const rangeSpan = chartInfo.safeMax - chartInfo.safeMin;
                    const padding = Math.max(10, Math.floor(rangeSpan * 0.5));
                    const calculatedMin = Math.floor(Math.min(min, chartInfo.safeMin) - padding);
                    return activeTab === 'temperature' ? calculatedMin : Math.max(0, calculatedMin);
                  },
                  (dataMax) => {
                    const max = Number(dataMax);
                    if (!isFinite(max)) return 100;
                    if (activeTab === 'all' || chartInfo.safeMax == null || chartInfo.safeMin == null) {
                      return Math.ceil(max + 10);
                    }
                    const rangeSpan = chartInfo.safeMax - chartInfo.safeMin;
                    const padding = Math.max(10, Math.floor(rangeSpan * 0.5));
                    return Math.ceil(Math.max(max, chartInfo.safeMax) + padding);
                  }
                ]}
                tickFormatter={(value) => {
                  const num = Number(value);
                  return isNaN(num) ? '' : Math.round(num);
                }} 
              />
              
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                itemStyle={{ fontWeight: 'bold' }} 
                formatter={(value) => {
                  const num = Number(value);
                  return isNaN(num) ? '데이터 없음' : num.toFixed(1);
                }} 
              />
              <Legend verticalAlign="top" height={40} />
              
              {activeTab !== 'all' && chartInfo.safeMin != null && chartInfo.safeMax != null && (
                <ReferenceArea 
                  y1={chartInfo.safeMin} 
                  y2={chartInfo.safeMax} 
                  fill="#10b981" 
                  fillOpacity={0.08} 
                  ifOverflow="extend" 
                />
              )}

              {(activeTab === 'all' || activeTab === 'moisture') && 
                <Line connectNulls type="monotone" dataKey="soil_moisture" name="토양 습도 (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'temperature') && 
                <Line connectNulls type="monotone" dataKey="temperature" name="온도 (°C)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {(activeTab === 'all' || activeTab === 'humidity') && 
                <Line connectNulls type="monotone" dataKey="humidity" name="주변 습도 (%)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              
              {/* 💡 데이터가 2개 미만일 때 Brush가 차트를 터뜨리는 현상 방지 */}
              {chartData.length > 1 && (
                <Brush dataKey="label" height={30} stroke="#d1d5db" fill="#f9fafb" travellerWidth={10} startIndex={startIndex} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {renderAddPotModal()}
    </div>
  );
}

export default AnalysisPage;