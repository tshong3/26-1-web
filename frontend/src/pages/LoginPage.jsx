import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSensorStore from '../store/useSensorStore'; 
import mainLogo from '../assets/logo.png'; 
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useSensorStore(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveId, setSaveId] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setSaveId(true);
    }
  }, []);

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
      if (saveId) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }
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
            <img 
              src={mainLogo} 
              alt="식물 키우기 로고" 
              style={{ width: '56px', height: '56px', objectFit: 'contain' }} 
            />
          </div>
          <h2>로그인</h2>
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
              <input 
                type="checkbox" 
                checked={saveId}
                onChange={(e) => setSaveId(e.target.checked)}
              /> 이메일 저장
            </label>
            <span 
              className="forgot-password" 
              onClick={() => alert('준비 중')}
            >
              비밀번호 찾기
            </span>
          </div>

          <button type="submit" className="btn-login-submit" disabled={loading}>
            {loading ? '로그인' : '로그인'}
          </button>
        </form>

        <div className="signup-link-box">
          계정이 없으신가요?
          <Link to="/register" className="signup-link">회원가입</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;