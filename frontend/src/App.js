import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useSensorStore from './store/useSensorStore';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ControlPage from './pages/ControlPage';
import AnalysisPage from './pages/AnalysisPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // 로그인 상태 가져오기
  const { isLoggedIn } = useSensorStore();

  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          {/* 로그인 상태가 true면 무조건 대시보드로 강제 이동 */}
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <HomePage />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          {/* 로그인한 사용자만 접근 가능한 보호된 라우트 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/control" element={<ControlPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Route>
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;