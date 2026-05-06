// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSensorStore from '../store/useSensorStore'; // 💡 스토어 불러오기
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useSensorStore(); // 💡 스토어에서 로그인 작동 함수 가져오기
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      login(); // 💡 시스템 전체의 로그인 상태를 '참(true)'으로 변경!
      alert('환영합니다!');
      navigate('/pots'); 
    } else {
      alert('이메일과 비밀번호를 모두 입력해 주세요.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon-large">🌱</span>
          </div>
          <h2>식물 키우기</h2>
          <p>내 손안의 스마트 가드닝 시스템</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>이메일</label>
            <input 
              type="email" 
              placeholder="example@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>비밀번호</label>
            <input 
              type="password" 
              placeholder="비밀번호를 입력하세요" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> 자동 로그인
            </label>
            <span className="forgot-password">비밀번호 찾기</span>
          </div>

          <button type="submit" className="btn-login-submit">
            로그인
          </button>
        </form>

        <div className="signup-link-box">
          계정이 없으신가요? <span className="signup-link">회원가입하기</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;