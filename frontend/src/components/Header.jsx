// src/components/Header.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
// 💡 피그마 디자인과 비슷한 아웃라인 아이콘들을 불러옵니다.
import { MdOutlineHome, MdOutlineSpaceDashboard, MdOutlineInsights, MdOutlineChatBubbleOutline } from "react-icons/md";
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="logo-icon">🌱</span>
          <h1 className="logo-text">스마트 가드닝</h1>
        </Link>
      </div>

      <nav className="header-nav">
        {/* 💡 NavLink는 현재 경로와 맞으면 자동으로 className에 'active'를 추가해줍니다. */}
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineHome className="nav-icon" /> 홈
        </NavLink>
        
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineSpaceDashboard className="nav-icon" /> 대시보드
        </NavLink>
        
        <NavLink to="/analysis" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineInsights className="nav-icon" /> 데이터 분석
        </NavLink>
        
        <NavLink to="/ai-guide" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineChatBubbleOutline className="nav-icon" /> AI 가이드
        </NavLink>
      </nav>

      <div className="header-auth">
        <span className="login-btn">로그인</span>
        <button className="signup-btn">회원가입</button>
      </div>
    </header>
  );
}

export default Header;