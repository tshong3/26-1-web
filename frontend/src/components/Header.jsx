import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MdLogout } from "react-icons/md"; 
import useSensorStore from '../store/useSensorStore';
import './Header.css';

function Header() {
  const { isLoggedIn, logout } = useSensorStore();
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
            {/* 로그인 후 */}
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
              href="#features" 
              className={activeSection === 'features' ? "nav-item active" : "nav-item"}
            >
              서비스 소개
            </a>
          </>
        )}
      </nav>

      <div className="header-auth">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn">
            <MdLogout className="nav-icon" style={{ fontSize: '18px' }}/> 로그아웃
          </button>
        ) : (
          <>
            <Link to="/login" className="login-btn">로그인</Link>
            <Link to="/login" className="signup-btn">무료로 시작하기</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;