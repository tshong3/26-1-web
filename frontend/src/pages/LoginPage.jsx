// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 💡 Link 추가
import useSensorStore from '../store/useSensorStore'; 
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useSensorStore(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // 💡 로딩 상태 추가

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email && password) {
      setLoading(true); // 통신 시작 시 버튼 비활성화
      
      const result = await login(email, password); // 💡 API 비동기 호출
      
      setLoading(false); // 통신 종료

      if (result.success) {
        alert('환영합니다!');
        // 로그인 성공 시 바로 대시보드 화면으로 이동
        navigate('/dashboard'); 
      } else {
        alert(result.message); // 백엔드에서 전달한 에러 메시지 출력
      }
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
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <label>비밀번호</label>
            <input 
              type="password" 
              placeholder="비밀번호를 입력하세요" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> 자동 로그인
            </label>
            <span className="forgot-password">비밀번호 찾기</span>
          </div>

          <button type="submit" className="btn-login-submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="signup-link-box">
          계정이 없으신가요? 
          {/* 💡 a 태그나 span 대신 라우터 Link로 변경하여 회원가입 페이지로 연결 */}
          <Link to="/register" className="signup-link">회원가입하기</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;