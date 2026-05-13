import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MdLogout, MdNotifications, MdNotificationsNone } from "react-icons/md"; 
import useSensorStore from '../store/useSensorStore';
import useNotificationStore from '../store/useNotificationStore'; 
import './Header.css';

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return '방금 전';
  if (diffInMins < 60) return `${diffInMins}분 전`;
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  return `${diffInDays}일 전`;
};

function Header() {
  const { isLoggedIn, logout, nickname, potList } = useSensorStore(); 
  
  const { 
    unreadCount, fetchUnreadCount, 
    notifications, fetchNotifications, loading, 
    markAsRead, markAllAsRead 
  } = useNotificationStore(); 
  
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState('home');
  const [isNotiOpen, setIsNotiOpen] = useState(false); 
  const notiRef = useRef(null); 

  useEffect(() => {
    const handleScroll = () => {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        const featuresTop = featuresSection.offsetTop - 100;
        setActiveSection(window.scrollY >= featuresTop ? 'features' : 'home');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]); 

  useEffect(() => {
    let interval;
    if (isLoggedIn) {
      fetchUnreadCount();
      interval = setInterval(() => {
        fetchUnreadCount();
      }, 60000); 
    }

    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLoggedIn, fetchUnreadCount]);

  useEffect(() => {
    if (isNotiOpen) {
      fetchNotifications();
    }
  }, [isNotiOpen, fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  const scrollToFeatures = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
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
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={activeSection === 'home' ? "nav-item active" : "nav-item"}>
              홈
            </Link>
            <a onClick={scrollToFeatures} className={activeSection === 'features' ? "nav-item active" : "nav-item"} style={{ cursor: 'pointer' }}>
              서비스 소개
            </a>
          </>
        )}
      </nav>

      <div className="header-auth">
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            <div className="notification-wrapper" ref={notiRef}>
              <button className="noti-btn" onClick={() => setIsNotiOpen(!isNotiOpen)}>
                {unreadCount > 0 ? (
                  <MdNotifications className="noti-icon active-icon" />
                ) : (
                  <MdNotificationsNone className="noti-icon" />
                )}
                {unreadCount > 0 && (
                  <span className="noti-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotiOpen && (
                <div className="noti-dropdown">
                  <div className="noti-dropdown-header">
                    <h4>알림</h4>
                    <button className="mark-all-read-btn" onClick={markAllAsRead}>
                      모두 읽음
                    </button>
                  </div>
                  
                  <div className="noti-dropdown-body">
                    {loading && notifications.length === 0 ? (
                      <div className="noti-empty">알림을 불러오는 중...</div>
                    ) : notifications.length === 0 ? (
                      <div className="noti-empty">새로운 알림이 없습니다.</div>
                    ) : (
                      notifications.map((noti) => {
                        const targetPot = potList.find(p => p.id === noti.pot_id);
                        const potName = targetPot ? targetPot.potName : '알 수 없는 화분';

                        return (
                          <div 
                            key={noti.id} 
                            className={`noti-item ${noti.is_read ? 'read' : 'unread'}`}
                            onClick={() => {
                              if (!noti.is_read) markAsRead(noti.id);
                            }}
                          >
                            <div className="noti-content">
                              <p className="noti-pot-name">[{potName}]</p>
                              <p className="noti-message">{noti.message}</p>
                              <span className="noti-time">{timeAgo(noti.created_at)}</span>
                            </div>
                            {!noti.is_read && <div className="noti-dot"></div>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <span style={{ fontWeight: '600', color: '#0f172a' }}>{nickname}님</span>
            <button onClick={handleLogout} className="logout-btn">
              <MdLogout className="nav-icon" style={{ fontSize: '18px' }}/> 로그아웃
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="login-btn">로그인</Link>
            <Link to="/register" className="signup-btn">회원가입</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;