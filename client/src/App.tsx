import React from 'react';
import { Layout, Menu, ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';

import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import CreateQuestion from './pages/CreateQuestion';
import QuestionDetail from './pages/QuestionDetail';
import EditQuestion from './pages/EditQuestion';
import UserProfile from './pages/UserProfile';
import SearchAndFilterPage from './pages/SearchAndFilterPage';
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
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <Router>
        <Layout className="layout" style={{ minHeight: '100vh', background: '#f8fafc' }}>
          <Header style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'linear-gradient(90deg, #1e1b4b 0%, #4338ca 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '0 50px'
          }}>
            <div className="logo" style={{ 
              color: 'white', 
              fontSize: '22px', 
              fontWeight: '800', 
              marginRight: '40px',
              letterSpacing: '1px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              SV-FORUM
            </div>
            <Menu 
              theme="dark" 
              mode="horizontal" 
              items={navItems} 
              style={{ 
                flex: 1, 
                background: 'transparent', 
                borderBottom: 'none',
                fontWeight: 500
              }} 
            />
          </Header>
          
          <Content style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              background: '#fff', 
              padding: '32px', 
              minHeight: '80vh', 
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              width: '100%',
              maxWidth: '1200px'
            }}>
              <Routes>
                <Route path="/" element={<HomePage />} />   
                <Route path="/welcome" element={<LandingPage />} /> 
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/create-question" element={<CreateQuestion />} />
                <Route path="/questions/:id" element={<QuestionDetail />} />
                <Route path="/questions/:id/edit" element={<EditQuestion />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/search" element={<SearchAndFilterPage />} />
                
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

          <Footer style={{ 
            textAlign: 'center', 
            background: '#f8fafc', 
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            padding: '24px'
          }}>
            Hệ thống Hỏi Đáp Sinh viên ©2026
          </Footer>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};
export default App;