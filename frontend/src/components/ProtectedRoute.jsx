import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useSensorStore from '../store/useSensorStore';

function ProtectedRoute() {
  const { isLoggedIn } = useSensorStore();

  // 토큰(로그인 상태)이 없다면 로그인 페이지로 강제 리다이렉트
  if (!isLoggedIn) {
    alert('로그인이 필요한 서비스입니다.');
    return <Navigate to="/login" replace />;
  }

  // 로그인 상태라면 정상적으로 하위 컴포넌트(대시보드 등)를 렌더링
  return <Outlet />;
}

export default ProtectedRoute;