import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEco } from "react-icons/md";
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // 실제 서비스에서는 여기서 백엔드 api로 로그인 요청을 보냄(지금은 테스트로 아무거나 입력해도 넘어감)
    if (email && password) {
      alert('환영합니다!');
      navigate('/pots'); // 로그인 성공 시 '내 화분 목록' 페이지로 이동
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
          <p>쉽고 편리한 식물 관리 시스템</p>
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
          계정이 없으신가요? <span className="signup-link">회원가입</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;