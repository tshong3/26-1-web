import React from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineWaterDrop, MdOutlineMonitor, MdOutlineBarChart, MdOutlineNotificationsActive, MdOutlineEco, MdOutlineBolt } from "react-icons/md";
import mainLogo from '../assets/logo.png'; 
import './HomePage.css';

function HomePage() {
  const features = [
    { id: 1, title: '실시간 환경 모니터링', desc: '온도, 습도 등 식물 주변의 환경 데이터를 실시간으로 확인해요', icon: <MdOutlineMonitor />, color: '#a855f7', bg: '#f3e8ff' },
    { id: 2, title: 'AI 진단 및 스마트 알림', desc: '식물 상태를 AI가 점검하며 여러 정보를 알림으로 보내드려요', icon: <MdOutlineNotificationsActive />, color: '#f43f5e', bg: '#ffe4e6' },
    { id: 3, title: '스마트 자동 급수', desc: '토양 습도를 분석하여 적절한 시점에 자동으로 물을 공급해요', icon: <MdOutlineWaterDrop />, color: '#3b82f6', bg: '#eff6ff' },
    { id: 4, title: '직관적인 데이터 차트', desc: '기간별 환경 데이터를 차트로 제공하여 식물의 상태를 쉽게 파악할 수 있어요', icon: <MdOutlineBarChart />, color: '#f59e0b', bg: '#fef3c7' },
  ];

  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      
      <div className="hero-bg-wrapper">
        <section className="hero-section">
          <div className="hero-content">
            
            <h1 className="hero-title">
              더 쉽고 더 편리한<br />
              <span className="text-highlight-yellow">식물 키우기</span>
            </h1>
            <p className="hero-subtitle">
              식물의 상태를 실시간으로 관찰하며 식물을 언제나 건강하게 유지헤요
            </p>
            
            <div className="hero-buttons">
              <Link to="/login" className="btn-primary-large">시작하기</Link>
              <a onClick={scrollToFeatures} className="btn-secondary-large" style={{ cursor: 'pointer' }}>더 알아보기</a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="app-mockup">
              <div className="mockup-header">
                <i></i><i></i><i></i>
              </div>
              <div className="mockup-body ai-theme">
                <div className="ai-status-header">
                  <div className="pulse-ring-wrapper">
                    <div className="pulse-ring"></div>
                    <div className="ai-main-icon"><MdOutlineEco /></div>
                  </div>
                  <h4>식물 관리 시스템 작동 중</h4>
                  <span className="ai-badge">SYSTEM ON</span>
                </div>

                <div className="ai-action-list">
                  <div className="ai-action-item">
                    <div className="action-icon bg-blue"><MdOutlineWaterDrop /></div>
                    <div className="action-text">
                      <strong>자동 급수 완료</strong>
                      <p>토양 건조 감지</p>
                    </div>
                  </div>
                  <div className="ai-action-item">
                    <div className="action-icon bg-yellow"><MdOutlineBolt /></div>
                    <div className="action-text">
                      <strong>햇빛 상태 양호</strong>
                      <p>광합성 효율 최적</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mockup-badge">
                <span className="live-dot"></span> 내 화분 관리 중...
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="feature-bg-wrapper" id="features">
        <section className="home-section feature-section">
          <div className="section-header text-center">
            <h2>모든 것을 알아서, 스마트하게</h2>
            <p>식물 초보자도 전문가처럼 키울 수 있는 유용한 기능들을 제공해요</p>
          </div>
          
          <div className="feature-grid">
            {features.map((item) => (
              <div key={item.id} className="feature-card glass-card">
                <div className="feature-icon" style={{ backgroundColor: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="cta-wrapper">
        <section className="cta-section modern-cta">
          <div className="cta-content">
            <h2>지금 식물을 등록하고 바로 시작해 보세요</h2>
            <p>쉽고 재미있게 식물을 키울 수 있어요</p>
          </div>
          <Link to="/login" className="btn-primary-large shadow-glow">시작하기</Link>
        </section>
      </div>

      <footer className="home-footer">
        <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <img 
            src={mainLogo} 
            alt="식물 키우기 footer 로고" 
            style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
          />
          <span className="logo-text-light">식물 키우기</span>
        </div>
        <p className="copyright">© 2026 농부들. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;