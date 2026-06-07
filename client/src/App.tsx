import React from 'react';
import { Layout, ConfigProvider, Button, Avatar, Dropdown, message, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/Homepage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import CreateQuestion from './pages/CreateQuestion';
import QuestionDetail from './pages/QuestionDetail';
import EditQuestion from './pages/EditQuestion';
import UserProfile from './pages/UserProfile';
import TeacherDashboard from './pages/TeacherDashboard';
import SearchAndFilterPage from './pages/SearchAndFilterPage';
import BookmarksPage from './pages/BookmarksPage';
import TagsPage from './pages/TagsPage'; 
import { NotificationBell } from './components/NotificationBell';
import {
  SearchOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CommentOutlined,
  BookOutlined,
  TeamOutlined,
  FormOutlined,
  TagOutlined
} from '@ant-design/icons';
import './App.css';
import { StudentChatbot } from './components/StudentChatbot';

const { Header, Content, Sider } = Layout;

const getAvatarGradient = (name: string) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];
  const index = (name || 'A').charCodeAt(0) % gradients.length;
  return gradients[index];
};

// Component Layout con để sử dụng được hooks của react-router-dom
const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = localStorage.getItem('user');
  const parsedUser = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.clear();
    message.success('Đăng xuất thành công!');
    navigate('/welcome');
  };

  // Menu Avatar Dropdown
  const avatarMenuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">Hồ sơ cá nhân</Link>,
      icon: <UserOutlined />
    },
    ...(parsedUser?.role === 'admin' ? [{
      key: 'admin',
      label: <Link to="/admin">Quản trị hệ thống</Link>,
      icon: <SettingOutlined />
    }] : []),
    ...(parsedUser?.role === 'teacher' ? [
      {
        key: 'teacher-dashboard',
        label: <Link to="/teacher-dashboard">Bảng điều khiển GV</Link>,
        icon: <SettingOutlined />
      },
      {
        key: 'announcement',
        label: <Link to="/create-question?type=announcement">Tạo Thông báo</Link>,
        icon: <CommentOutlined />
      }
    ] : []),
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: <span className="menu-logout-text">Đăng xuất</span>,
      icon: <LogoutOutlined className="menu-logout-icon" />,
      onClick: handleLogout
    }
  ];



  // Xác định active menu item dựa vào pathname

  const isAdmin = location.pathname.startsWith('/admin');
  const hideSidebar = ['/login', '/register', '/forgot-password', '/reset-password', '/welcome'].includes(location.pathname) || isAdmin;
  const hideLayout = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isLandingPage = location.pathname === '/welcome';

  // Xây dựng menuItems cho Menu của Ant Design v6
  const getMenuItems = () => {
    const role = parsedUser?.role;
    
    // Các mục chung cho tất cả mọi người (kể cả Guest/Student)
    const baseItems = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: 'Trang chủ'
      },
      {
        key: '/search',
        icon: <SearchOutlined />,
        label: 'Tìm kiếm câu hỏi'
      },
      {
        key: '/tags',
        icon: <TagOutlined />,
        label: 'Thẻ câu hỏi'
      },
      {
        key: '/create-question',
        icon: <FormOutlined />,
        label: 'Đặt câu hỏi mới'
      },
      {
        key: '/bookmarks',
        icon: <BookOutlined />,
        label: 'Bài viết đã lưu'
      }
    ];

    // Nếu là Teacher, thêm các trang đặc quyền
    if (role === 'teacher') {
      return [
        ...baseItems,
        {
          key: '/teacher/classes',
          icon: <TeamOutlined />,
          label: 'Không gian lớp học'
        },
        {
          key: '/teacher-dashboard',
          icon: <SettingOutlined />,
          label: 'Bảng điều khiển GV'
        }
      ];
    }

    // Nếu là Admin, thêm trang admin
    if (role === 'admin') {
      return [
        ...baseItems,
        {
          key: '/admin',
          icon: <SettingOutlined />,
          label: 'Quản trị hệ thống'
        }
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <Layout className="app-layout">
      
      {/* ==================== HEADER TRẮNG SANG TRỌNG ==================== */}
      {!hideLayout && (
      <Header className="app-header">
        {/* Logo bên trái */}
        <Link to={parsedUser ? '/' : '/welcome'} className="app-logo-link">
          <div className="app-logo-icon">
            D
          </div>
          <span className="app-logo-text">
            Diễn Đàn Công Nghệ
          </span>
        </Link>

        {/* Các nút bấm bên phải */}
        <div className="app-header-actions">
          
          {/* Chuông thông báo */}
          <NotificationBell />

          {/* Avatar / Nút đăng nhập */}
          {parsedUser ? (
            <Dropdown menu={{ items: avatarMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="app-avatar-wrapper">
                <Avatar 
                  size={40} 
                  className="app-avatar"
                  src={parsedUser.avatar}
                  onError={() => true}
                  style={{
                    background: getAvatarGradient(parsedUser.fullName || parsedUser.username || 'U'),
                    color: '#ffffff',
                    fontWeight: 600,
                    border: '2px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {(parsedUser.fullName || parsedUser.username || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <div className="status-indicator-dot" />
              </div>
            </Dropdown>
          ) : (
            <div className="app-auth-buttons">
              <Button type="text" onClick={() => navigate('/login')} className="app-btn-login">
                Đăng nhập
              </Button>
              <Button type="primary" onClick={() => navigate('/register')} className="app-btn-register">
                Đăng ký
              </Button>
            </div>
          )}

        </div>
      </Header>
      )}

      {/* ==================== THÂN TRANG GỒM SIDEBAR TRÁI + MAIN CONTENT ==================== */}
      <Layout className="app-main-layout">
        
        {/* SIDEBAR TRÁI */}
        {!hideSidebar && (
        <Sider 
          width={280} 
          theme="light"
          className="app-sidebar"
        >
          <div className="sidebar-header-wrapper">
            <div className="sidebar-section-title">
              <span className="sidebar-title-dot"></span>
              KHÁM PHÁ
            </div>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={(info) => {
              navigate(info.key);
            }}
            items={menuItems}
            style={{ borderRight: 0, padding: '0 12px' }}
            className="sidebar-antd-menu"
          />
        </Sider>
        )}

        {/* MAIN CONTENT AREA */}
        <Content className={`app-content ${hideLayout ? 'hide-layout' : ''} ${isAdmin ? 'admin-content-wrapper' : ''} ${isLandingPage ? 'landing-page-content-wrapper' : ''}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />   
            <Route path="/welcome" element={<LandingPage />} /> 
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/create-question" element={<CreateQuestion />} />
            <Route path="/questions/:id" element={<QuestionDetail />} />
            <Route path="/questions/:id/edit" element={<EditQuestion />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/search" element={<SearchAndFilterPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route 
              path="/bookmarks" 
              element={
                <ProtectedRoute>
                  <BookmarksPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher-dashboard" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard defaultTab="overview" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/classes" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard defaultTab="students" />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/posts" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/broadcast" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tags" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Content>

      </Layout>
      <StudentChatbot />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 12,
          fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <Router>
        <AppContent />
      </Router>
    </ConfigProvider>
  );
};

export default App;