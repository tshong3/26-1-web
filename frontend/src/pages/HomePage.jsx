import React from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineWaterDrop, MdOutlineInsights, MdOutlineEco, MdOutlineBolt, MdOutlineShield, MdOutlineNotificationsActive } from "react-icons/md";
import './HomePage.css';

function HomePage() {
  // 기능 소개 데이터 배열
  const features = [
    { id: 1, title: '자동 물주기', desc: '토양 습도를 실시간 모니터링하여 최적의 시점에 자동으로 물을 공급합니다.', icon: <MdOutlineWaterDrop />, color: '#10b981', bg: '#ecfdf5' },
    { id: 2, title: '데이터 분석', desc: '센서 데이터를 시각화하여 식물의 생육 환경을 한눈에 파악할 수 있습니다.', icon: <MdOutlineInsights />, color: '#6366f1', bg: '#eef2ff' },
    { id: 3, title: 'AI 식물 가이드', desc: '실시간 데이터 기반으로 식물 관리에 대한 맞춤형 조언을 제공합니다.', icon: <MdOutlineEco />, color: '#f59e0b', bg: '#fffbeb' },
    { id: 4, title: '실시간 모니터링', desc: '온도, 습도, 토양 수분 등 모든 환경 데이터를 실시간으로 확인합니다.', icon: <MdOutlineBolt />, color: '#a855f7', bg: '#faf5ff' },
    { id: 5, title: '자동화 시스템', desc: '여행이나 외출 중에도 식물이 건강하게 자랄 수 있도록 자동 관리합니다.', icon: <MdOutlineShield />, color: '#0ea5e9', bg: '#f0f9ff' },
    { id: 6, title: '스마트 알림', desc: '식물 관리가 필요한 시점을 정확하게 알려드립니다.', icon: <MdOutlineNotificationsActive />, color: '#f43f5e', bg: '#fff1f2' },
  ];

  // 작동 원리 데이터 배열
  const steps = [
    { step: '01', title: '센서 측정', desc: '아두이노 센서가 토양 습도, 온도, 습도를 실시간으로 측정합니다.' },
    { step: '02', title: '데이터 전송', desc: '측정된 데이터가 웹 서버로 전송되어 저장됩니다.' },
    { step: '03', title: '분석 및 판단', desc: 'AI가 데이터를 분석하여 최적의 관리 방법을 결정합니다.' },
    { step: '04', title: '자동 제어', desc: '필요시 자동으로 물 주기를 실행하고 사용자에게 알림을 보냅니다.' },
  ];

  return (
    <div className="home-container">
      
      {/* 핵심 기능 소개 영역 */}
      <section className="home-section feature-section">
        <div className="feature-grid">
          {features.map((item) => (
            <div key={item.id} className="feature-card">
              <div 
                className="feature-icon" 
                style={{ backgroundColor: item.bg, color: item.color }}
              >
                {item.icon}
              </div>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 동작 방법 영역 */}
      <section className="home-section how-it-works-section">
        <div className="section-header">
          <h2>어떻게 작동하나요?</h2>
          <p>간단한 4단계로 식물을 스마트하게 관리하세요</p>
        </div>
        
        <div className="steps-grid">
          {steps.map((item, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{item.step}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 하단 시작하기 및 footer 영역 */}
      <div className="cta-footer-wrapper">
        <section className="cta-section">
          <h2>지금 바로 시작하세요</h2>
          <p>스마트 화분 시스템으로 식물 관리의 새로운 경험을 만나보세요</p>
          <div className="cta-buttons">
            <Link to="/dashboard" className="btn-primary">무료로 시작하기</Link>
            <button className="btn-secondary">둘러보기</button>
          </div>
        </section>

        <footer className="home-footer">
          <div className="footer-logo">
            <span className="logo-icon">🌱</span>
            <span className="logo-text-light">식물 키우기</span>
          </div>
          <p className="copyright">© 2026 Smart Home Gardening System. All rights reserved.</p>
        </footer>
      </div>

    </div>
  );
}

export default HomePage;