import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MdLogout } from "react-icons/md"; 
import useSensorStore from '../store/useSensorStore';
import './Header.css';

function Header() {
  const { isLoggedIn, logout, nickname } = useSensorStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const featuresSection = document.getElementById('features');
      
      if (featuresSection) {
        const featuresTop = featuresSection.offsetTop - 100;
        if (window.scrollY >= featuresTop) {
          setActiveSection('features');
        } else {
          setActiveSection('home');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]); 

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/'); 
  };

  const scrollToFeatures = (e) => {
    e.preventDefault();

    if (location.pathname !== '/') {
      // 다른 페이지에 있다면 홈으로 먼저 이동 후 스크롤
      navigate('/');
      setTimeout(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // 이미 홈 화면이라면 바로 스크롤
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header">
      <div className="header-logo">
        <Link 
          to="/" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="logo-icon">🌱</span>
          <h1 className="logo-text">식물 키우기</h1>
        </Link>
      </div>

      <nav className="header-nav">
        {isLoggedIn ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              대시보드
            </NavLink>
            <NavLink to="/control" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              급수 시스템
            </NavLink>
            <NavLink to="/analysis" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              데이터 분석
            </NavLink>
          </>
        ) : (
          <>
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={activeSection === 'home' ? "nav-item active" : "nav-item"}
            >
              홈
            </Link>
            <a 
              onClick={scrollToFeatures}
              className={activeSection === 'features' ? "nav-item active" : "nav-item"}
              style={{ cursor: 'pointer' }}
            >
              서비스 소개
            </a>
          </>
        )}
      </nav>

      <div className="header-auth">
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: '600', color: '#0f172a' }}>{nickname}님</span>
            <button onClick={handleLogout} className="logout-btn">
              <MdLogout className="nav-icon" style={{ fontSize: '18px' }}/> 로그아웃
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="login-btn">로그인</Link>
            <Link to="/register" className="signup-btn">무료로 시작하기</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;