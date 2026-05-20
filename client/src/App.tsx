import React from 'react';
import { Layout, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';

import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import CreateQuestion from './pages/CreateQuestion';
import QuestionDetail from './pages/QuestionDetail';
import UserProfile from './pages/UserProfile';
const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  const userData = localStorage.getItem('user');
  const parsedUser = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/welcome';
  };

  // Menu items linh hoạt
  const navItems = [
    {
      key: parsedUser ? '/' : '/welcome',
      label: <Link to={parsedUser ? '/' : '/welcome'}>Trang chủ</Link>,
    },
    // Nếu là admin thì hiện thêm nút quản trị trên menu cho dễ vào
    ...(parsedUser?.role === 'admin' ? [{
      key: '/admin',
      label: <Link to="/admin">Quản trị</Link>,
    }] : []),
    ...(parsedUser ? [
      {
        key: '/profile',
        label: <Link to="/profile">Hồ sơ cá nhân</Link>,
      },
      {
        key: 'logout',
        label: <span onClick={handleLogout} style={{ color: '#ff4d4f' }}>Đăng xuất</span>,
      }
    ] : [
      {
        key: '/login',
        label: <Link to="/login">Đăng nhập</Link>,
      }
    ])
  ];

  return (
    <Router>
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div className="logo" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '40px' }}>
            SV-FORUM
          </div>
          <Menu theme="dark" mode="horizontal" items={navItems} style={{ flex: 1 }} />
        </Header>
        
        <Content style={{ padding: '24px 50px', background: '#f0f2f5' }}>
          <div style={{ background: '#fff', padding: 24, minHeight: '80vh', borderRadius: '8px' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />   
              <Route path="/welcome" element={<LandingPage />} /> 
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/create-question" element={<CreateQuestion />} />
              <Route path="/questions/:id" element={<QuestionDetail />} />
              <Route path="/profile" element={<UserProfile />} />
              
              {/* Bọc trang Admin bằng ProtectedRoute */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Hệ thống Hỏi Đáp Sinh viên ©2026
        </Footer>
      </Layout>
    </Router>
  );
};
export default App;