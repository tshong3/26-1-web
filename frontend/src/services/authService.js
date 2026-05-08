// src/services/authService.js
import api from './api';

export const authService = {
  // 1. 로그인 (POST /api/auth/login)
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data; // 서버가 응답한 { token: "..." } 데이터를 반환합니다.
  },

  // 2. 로그아웃 (POST /api/auth/logout)
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // 3. 회원가입 (POST /api/auth/register) - 다음 단계를 위해 미리 작성
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  }
};