// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './LoginPage.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(''); // 💡 닉네임 상태 추가
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    // 💡 닉네임 입력 여부도 함께 확인
    if (!nickname || !email || !password || !passwordConfirm) {
      return alert('모든 항목을 입력해 주세요.');
    }
    if (password !== passwordConfirm) {
      return alert('비밀번호가 일치하지 않습니다.');
    }

    setLoading(true);
    try {
      // 💡 백엔드 명세서에 맞춰 닉네임 데이터도 함께 전송
      await authService.register({ email, password, nickname });
      alert('회원가입이 완료되었습니다! 로그인해 주세요.');
      navigate('/login'); // 가입 성공 시 로그인 페이지로 이동
    } catch (error) {
      console.error('회원가입 에러:', error);
      alert(error.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon-large">🌱</span>
          </div>
          <h2>회원가입</h2>
          <p>식물 키우기에 오신 것을 환영합니다</p>
        </div>

        <form className="login-form" onSubmit={handleRegister}>
          {/* 💡 닉네임 입력 칸 추가 (이메일 위쪽으로 배치) */}
          <div className="input-group">
            <label>닉네임</label>
            <input 
              type="text" 
              placeholder="사용할 닉네임을 입력하세요" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
            />
          </div>

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

          <div className="input-group">
            <label>비밀번호 확인</label>
            <input 
              type="password" 
              placeholder="비밀번호를 다시 입력하세요" 
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-login-submit" disabled={loading}>
            {loading ? '가입 처리 중...' : '회원가입 완료'}
          </button>
        </form>

        <div className="signup-link-box">
          이미 계정이 있으신가요? <Link to="/login" className="signup-link">로그인하기</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;