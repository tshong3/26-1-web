import axios from 'axios';

const api = axios.create({
  baseURL: 'http://farm.nulldns.top', // 메인 서버 주소
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰이 있으면 알아서 Authorization 헤더에 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;