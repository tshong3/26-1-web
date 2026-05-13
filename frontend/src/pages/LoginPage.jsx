import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSensorStore from '../store/useSensorStore'; 
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useSensorStore(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    let newErrors = { email: '', password: '' };
    let hasError = false;

    if (!email) {
      newErrors.email = '이메일을 입력하세요.';
      hasError = true;
    }
    if (!password) {
      newErrors.password = '비밀번호를 입력하세요.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return; 
    }

    setLoading(true); 
    const result = await login(email, password); 
    setLoading(false); 

    if (result.success) {
      navigate('/dashboard'); 
    } else {
      alert(result.message);
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
          <Link to="/register" className="signup-link">계정 만들기</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;