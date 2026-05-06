import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { MdOutlineSpaceDashboard, MdOutlineInsights, MdOutlineTune, MdLogout } from "react-icons/md";
import useSensorStore from '../store/useSensorStore';
import './Header.css';

function Header() {
  const { isLoggedIn, logout } = useSensorStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/'); 
  };

  return (
    <header className="header">
      <div className="header-logo">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="logo-icon">🌱</span>
          <h1 className="logo-text">식물 키우기</h1>
        </Link>
      </div>

      <nav className="header-nav">
        {isLoggedIn ? (
          /* 로그인 후: 실제 관리 앱 메뉴 */
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <MdOutlineSpaceDashboard className="nav-icon" /> 대시보드
            </NavLink>
            <NavLink to="/control" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <MdOutlineTune className="nav-icon" /> 급수 시스템
            </NavLink>
            <NavLink to="/analysis" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <MdOutlineInsights className="nav-icon" /> 데이터 분석
            </NavLink>
          </>
        ) : (
          /* 로그인 전: 웹사이트 소개용 메뉴 */
          <>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
              홈
            </NavLink>
            {/* 아직 페이지가 없으므로 클릭 시 제자리에 머물게 한 시각적 더미 메뉴 */}
            <a href="#features" className="nav-item">기능 소개</a>
            <a href="#ai-care" className="nav-item">스마트 케어</a>
            <a href="#guide" className="nav-item">이용 가이드</a>
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
            <Link to="/login" className="signup-btn">회원가입</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;