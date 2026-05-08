import React from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineWaterDrop, MdOutlineEco, MdOutlineBolt, MdOutlineNotificationsActive } from "react-icons/md";
import './HomePage.css';

function HomePage() {
  // 기능 4개로 압축
  const features = [
    { id: 1, title: '스마트 자동 급수', desc: '토양 습도를 분석해 최적의 시점에 알아서 물을 줍니다. 장기 외출 시에도 안심하세요.', icon: <MdOutlineWaterDrop />, color: '#10b981', bg: '#ecfdf5' },
    { id: 2, title: '실시간 환경 모니터링', desc: '온도, 습도, 조도 등 화분 주변의 모든 생육 데이터를 지연 없이 실시간으로 확인합니다.', icon: <MdOutlineBolt />, color: '#a855f7', bg: '#f3e8ff' },
    { id: 3, title: 'AI 데이터 분석 및 진단', desc: '수집된 센서 데이터를 AI가 분석하여, 현재 식물 상태에 맞는 맞춤형 관리 가이드를 제공합니다.', icon: <MdOutlineEco />, color: '#f59e0b', bg: '#fef3c7' },
    { id: 4, title: '이상 감지 스마트 알림', desc: '물탱크 수위가 낮아지거나 치명적인 환경 변화가 감지되면 즉시 알림을 보내드립니다.', icon: <MdOutlineNotificationsActive />, color: '#f43f5e', bg: '#ffe4e6' },
  ];

  return (
    <div className="home-container">
      
      <div className="hero-bg-wrapper">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">✨ Smart Home Gardening</div>
            
            <h1 className="hero-title">
              더 쉽고 더 편리한<br />
              <span className="text-highlight-yellow">식물 키우기</span>
            </h1>
            <p className="hero-subtitle">
              식물의 상태를 실시간으로 관찰하며 식물을 언제나 건강하게 유지합니다.
            </p>
            
            <div className="hero-buttons">
              <Link to="/login" className="btn-primary-large">무료로 시작하기</Link>
              <a href="#features" className="btn-secondary-large">더 알아보기</a>
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
                  <h4>AI 스마트 케어 작동 중</h4>
                  <span className="ai-badge">Auto Mode ON</span>
                </div>

                <div className="ai-action-list">
                  <div className="ai-action-item">
                    <div className="action-icon bg-blue"><MdOutlineWaterDrop /></div>
                    <div className="action-text">
                      <strong>자동 급수 완료</strong>
                      <p>토양 건조 감지 (방금 전)</p>
                    </div>
                  </div>
                  <div className="ai-action-item">
                    <div className="action-icon bg-yellow"><MdOutlineBolt /></div>
                    <div className="action-text">
                      <strong>광합성 효율 최적</strong>
                      <p>창가 햇빛 상태 양호</p>
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
            <p>식물 초보자도 전문가처럼 키울 수 있는 강력한 기능들</p>
          </div>
          
          {/* 카드 그리드 영역 */}
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
            <h2>지금 바로 식물 키우기를 경험하세요</h2>
            <p>몇 번의 클릭만으로 내 화분과 웹을 연동할 수 있습니다.</p>
          </div>
          <Link to="/login" className="btn-primary-large shadow-glow">내 화분 등록하기</Link>
        </section>
      </div>

      <footer className="home-footer">
        <div className="footer-logo">
          <span className="logo-icon">🌱</span>
          <span className="logo-text-light">식물 키우기</span>
        </div>
        <p className="copyright">© 2026 Smart Home Gardening System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;