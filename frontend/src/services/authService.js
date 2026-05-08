import api from './api';

export const authService = {
  // 로그인 (POST /api/auth/login)
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data; // 서버가 응답한 { token: "..." } 데이터를 반환
  },

  // 로그아웃 (POST /api/auth/logout)
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // 회원가입 (POST /api/auth/register)
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  }
};