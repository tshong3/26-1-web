// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './LoginPage.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ nickname: '', email: '', password: '', passwordConfirm: '' });

  const handleRegister = async (e) => {
    e.preventDefault();

    let newErrors = { nickname: '', email: '', password: '', passwordConfirm: '' };
    let hasError = false;

    // 각 칸별 에러 검증 로직
    if (!nickname) {
      newErrors.nickname = '닉네임을 입력하세요.';
      hasError = true;
    }
    if (!email) {
      newErrors.email = '이메일을 입력하세요.';
      hasError = true;
    }
    if (!password) {
      newErrors.password = '비밀번호를 입력하세요.';
      hasError = true;
    }
    if (!passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호를 한 번 더 입력하세요.';
      hasError = true;
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.register({ email, password, nickname });
      alert('회원가입이 완료되었습니다! 로그인해 주세요.');
      navigate('/login'); 
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
          <div className="input-group">
            <label>닉네임</label>
            <input 
              type="text" 
              className={errors.nickname ? 'error-border' : ''}
              placeholder="사용할 닉네임을 입력하세요" 
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setErrors(prev => ({ ...prev, nickname: '' }));
              }}
              disabled={loading}
            />
            {errors.nickname && <span className="error-text">{errors.nickname}</span>}
          </div>

          <div className="input-group">
            <label>이메일</label>
            <input 
              type="email" 
              className={errors.email ? 'error-border' : ''}
              placeholder="example@email.com" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: '' }));
              }}
              disabled={loading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="input-group">
            <label>비밀번호</label>
            <input 
              type="password" 
              className={errors.password ? 'error-border' : ''}
              placeholder="비밀번호를 입력하세요" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: '' }));
              }}
              disabled={loading}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label>비밀번호 확인</label>
            <input 
              type="password" 
              className={errors.passwordConfirm ? 'error-border' : ''}
              placeholder="비밀번호를 다시 입력하세요" 
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                setErrors(prev => ({ ...prev, passwordConfirm: '' }));
              }}
              disabled={loading}
            />
            {errors.passwordConfirm && <span className="error-text">{errors.passwordConfirm}</span>}
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