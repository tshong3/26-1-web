import React, { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MdInfoOutline, MdOutlineTipsAndUpdates, MdWarningAmber } from 'react-icons/md';
import { demoChartData, demoNotifications, demoPlant, demoSensors } from '../data/demoData';
import './DemoPage.css';

const PREVIEW_MESSAGE = '미리보기 모드에서는 실제 급수 기능이 실행되지 않습니다.';

function DemoPage() {
  const [autoWatering, setAutoWatering] = useState(true);
  const [threshold, setThreshold] = useState(40);
  const showPreviewMessage = () => window.alert(PREVIEW_MESSAGE);

  return <div className="demo-page">
    <section className="demo-hero"><span className="demo-badge">DEMO PREVIEW</span><h1>스마트 화분 미리보기</h1><p>로그인 없이 스마트 화분 서비스의 주요 기능을 한 화면에서 확인할 수 있습니다.</p><div className="demo-notice"><MdInfoOutline /><span>이 화면은 샘플 데이터를 기반으로 한 미리보기 화면이며, 실제 급수 제어는 실행되지 않습니다.</span></div></section>
    <section className="demo-plant-card"><div><span className="demo-label">Demo 화분 정보</span><h2>{demoPlant.potName}</h2><p>🪴 {demoPlant.plantName}</p></div><span className="demo-status">{demoPlant.status}</span></section>
    <section><div className="demo-heading"><h2>현재 센서 데이터</h2><span>샘플 데이터</span></div><div className="demo-sensor-grid">{demoSensors.map(sensor => <article className="demo-sensor-card" key={sensor.title}><div className="demo-sensor-icon">{sensor.icon}</div><span>{sensor.title}</span><strong>{sensor.value}<small>{sensor.unit}</small></strong><div>정상 범위</div></article>)}</div></section>
    <section className="demo-columns">
      <article className="demo-panel"><div className="demo-heading"><h2>Claude API 기반 알림 미리보기</h2><span>Mock</span></div><div className="demo-alert-list">{demoNotifications.map(item => <div className={`demo-alert ${item.type}`} key={item.title}><div>{item.type === 'weather' ? <MdOutlineTipsAndUpdates /> : <MdWarningAmber />}</div><div><strong>{item.title}</strong><p>{item.message}</p></div></div>)}</div></article>
      <article className="demo-panel"><div className="demo-heading"><h2>급수 시스템 미리보기</h2><span>제어 비활성</span></div><div className={`demo-auto-setting ${autoWatering ? 'active' : ''}`}><div className="demo-auto-head"><div><strong>자동 급수 설정</strong><p>토양 습도가 기준 이하일 때 자동으로 급수합니다.</p></div><label className="demo-toggle"><input type="checkbox" checked={autoWatering} onChange={e => setAutoWatering(e.target.checked)} /><span /></label></div><label className="demo-threshold"><span>토양 습도 기준값</span><div><input type="number" min="0" max="100" value={threshold} onChange={e => setThreshold(e.target.value)} /><span>% 이하</span></div></label></div><div className="demo-actions"><button onClick={showPreviewMessage}>설정 저장</button><button onClick={showPreviewMessage}>수동 급수 시작</button></div></article>
    </section>
    <section className="demo-panel"><div className="demo-heading"><div><h2>시간별 센서 변화</h2><p>온도, 습도, 토양 습도, 조도의 샘플 변화입니다.</p></div><span>오늘</span></div><div className="demo-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={demoChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="label" axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} /><Tooltip /><Legend verticalAlign="top" height={40} /><Line type="monotone" dataKey="temperature" name="온도 (°C)" stroke="#f59e0b" strokeWidth={3} /><Line type="monotone" dataKey="humidity" name="습도 (%)" stroke="#06b6d4" strokeWidth={3} /><Line type="monotone" dataKey="soilMoisture" name="토양 습도 (%)" stroke="#3b82f6" strokeWidth={3} /><Line type="monotone" dataKey="light" name="조도 (%)" stroke="#10b981" strokeWidth={3} /></LineChart></ResponsiveContainer></div></section>
  </div>;
}
export default DemoPage;
