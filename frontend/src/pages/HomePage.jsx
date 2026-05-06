import React from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineWaterDrop, MdOutlineInsights, MdOutlineEco, MdOutlineBolt, MdOutlineShield, MdOutlineNotificationsActive } from "react-icons/md";
import './HomePage.css';

function HomePage() {
  const features = [
    { id: 1, title: '자동 물주기', desc: '토양 습도를 실시간 모니터링하여 최적의 시점에 자동으로 물을 공급합니다.', icon: <MdOutlineWaterDrop />, color: '#10b981', bg: '#ecfdf5' },
    { id: 2, title: '데이터 분석', desc: '센서 데이터를 시각화하여 식물의 생육 환경을 한눈에 파악할 수 있습니다.', icon: <MdOutlineInsights />, color: '#6366f1', bg: '#e0e7ff' },
    { id: 3, title: 'AI 식물 가이드', desc: '실시간 데이터 기반으로 식물 관리에 대한 맞춤형 조언을 제공합니다.', icon: <MdOutlineEco />, color: '#f59e0b', bg: '#fef3c7' },
    { id: 4, title: '실시간 모니터링', desc: '온도, 습도, 조도 등 모든 환경 데이터를 실시간으로 확인합니다.', icon: <MdOutlineBolt />, color: '#a855f7', bg: '#f3e8ff' },
    { id: 5, title: '자동화 시스템', desc: '여행이나 외출 중에도 식물이 건강하게 자랄 수 있도록 자동 관리합니다.', icon: <MdOutlineShield />, color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 6, title: '스마트 알림', desc: '물 보충이나 식물 관리가 필요한 시점을 정확하게 알려드립니다.', icon: <MdOutlineNotificationsActive />, color: '#f43f5e', bg: '#ffe4e6' },
  ];

  return (
    <div className="home-container">
      
      <div className="hero-bg-wrapper">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">✨ Smart Home Gardening</div>
            <h1 className="hero-title">
              식물이 보내는 신호,<br />
              이제 <span className="text-highlight-yellow">놓치지 마세요</span>
            </h1>
            <p className="hero-subtitle">
              이제는 편리하게 관리하세요. 실시간 센서 데이터와 맞춤형 자동화 설정으로 식물을 언제나 건강하게 유지해 줍니다.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn-primary-large">무료로 시작하기</Link>
              <Link to="/dashboard" className="btn-secondary-large">대시보드 둘러보기</Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="app-mockup">
              <div className="mockup-header">
                <i></i><i></i><i></i>
              </div>
              <div className="mockup-body ai-theme">
                
                {/* 상단: AI 작동 애니메이션 */}
                <div className="ai-status-header">
                  <div className="pulse-ring-wrapper">
                    <div className="pulse-ring"></div>
                    <div className="ai-main-icon"><MdOutlineEco /></div>
                  </div>
                  <h4>AI 스마트 케어 작동 중</h4>
                  <span className="ai-badge">Auto Mode ON</span>
                </div>

                {/* 하단: 케어 로그 형식으로 서비스의 가치를 직관적으로 전달 */}
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

      <div className="feature-bg-wrapper">
        <section className="home-section feature-section">
          <div className="section-header text-center">
            <h2>모든 것을 알아서, 스마트하게</h2>
            <p>식물 초보자도 전문가처럼 키울 수 있는 강력한 기능들</p>
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
            <h2>지금 바로 식물 키우기 시스템을 경험하세요</h2>
            <p>편리하게 나의 화분과 웹을 연동할 수 있습니다.</p>
          </div>
          <Link to="/login" className="btn-primary-large shadow-glow">화분 등록하기</Link>
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