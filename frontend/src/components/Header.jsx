import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MdOutlineHome, MdOutlineSpaceDashboard, MdOutlineInsights, MdOutlineChatBubbleOutline, MdOutlineTune } from "react-icons/md";
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="logo-icon">🌱</span>
          <h1 className="logo-text">식물 키우기</h1>
        </Link>
      </div>

      <nav className="header-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineHome className="nav-icon" /> 홈
        </NavLink>
        
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineSpaceDashboard className="nav-icon" /> 대시보드
        </NavLink>

        <NavLink to="/control" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineTune className="nav-icon" /> 급수 시스템
        </NavLink>
        
        <NavLink to="/analysis" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineInsights className="nav-icon" /> 데이터 분석
        </NavLink>
        
        <NavLink to="/ai-guide" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MdOutlineChatBubbleOutline className="nav-icon" /> AI 가이드
        </NavLink>
      </nav>

      <div className="header-auth">
        <Link to="/login" className="login-btn" style={{ textDecoration: 'none' }}>로그인</Link>
        <button className="signup-btn">회원가입</button>
      </div>
    </header>
  );
}

export default Header;