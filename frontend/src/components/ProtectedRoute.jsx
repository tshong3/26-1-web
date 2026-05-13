import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useSensorStore from '../store/useSensorStore';

function ProtectedRoute() {
  const { isLoggedIn } = useSensorStore();

  // 토큰이 없거나 로그아웃 상태가 되면 알림창 없이 바로 홈 화면으로 강제 이동
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // 로그인 상태라면 정상적으로 하위 컴포넌트(대시보드, 급수, 분석 화면)를 렌더링
  return <Outlet />;
}

export default ProtectedRoute;