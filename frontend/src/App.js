import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useSensorStore from './store/useSensorStore';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ControlPage from './pages/ControlPage';
import AnalysisPage from './pages/AnalysisPage';
import DemoPage from './pages/DemoPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { isLoggedIn } = useSensorStore();
  const location = useLocation();
  const isDemoPage = location.pathname === '/demo';

  return <>
    {!isDemoPage && <Header />}
    <main><Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <HomePage />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Route>
    </Routes></main>
  </>;
}

function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
export default App;
