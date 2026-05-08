import React from 'react';
import { Layout, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  const user = localStorage.getItem('user');
  const parsedUser = user ? JSON.parse(user) : null;

  // Khai báo mảng items cho Menu
  const navItems = parsedUser ? [
    {
      key: '/',
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: '/logout',
      label: <span onClick={() => {
        localStorage.clear();
        window.location.href = '/welcome';
      }}>Đăng xuất</span>,
    },
  ] : [
    {
      key: '/welcome',
      label: <Link to="/welcome">Trang giới thiệu</Link>,
    },
    
  ];

  return (
    
      <Router>
        <Layout className="layout" style={{ minHeight: '100vh' }}>
          {/* Thanh điều hướng (Navbar) */}
          <Header style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              className="logo" 
              style={{ 
                color: 'white', 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginRight: '40px',
                cursor: 'pointer'
              }}
            >
              
            </div>
            
            <Menu 
              theme="dark" 
              mode="horizontal" 
              items={navItems} 
              selectedKeys={[window.location.pathname]} 
              style={{ flex: 1 }}
            />
          </Header>
          
          {/* Khu vực hiển thị nội dung chính */}
          <Content style={{ padding: '24px 50px', background: '#f0f2f5' }}>
            <div style={{ background: '#fff', padding: 24, minHeight: '80vh', borderRadius: '8px' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />  
                <Route path="/welcome" element={<LandingPage />} /> 
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                </Routes>
            </div>
          </Content>

          {/* Chân trang */}
          <Footer style={{ textAlign: 'center' }}>
            Hệ thống Hỏi Đáp Sinh viên ©2026 - Được xây dựng bởi Team Bài Tập Lớn
          </Footer>
        </Layout>
      </Router>
  )
};

export default App;