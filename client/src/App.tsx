import React, { useState } from 'react';
import { Layout, ConfigProvider, Input, Button, Avatar, Badge, Dropdown, Space, message } from 'antd';
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
import SearchAndFilterPage from './pages/SearchAndFilterPage';
import DiscussionsPage from './pages/DiscussionsPage';
import {
  SearchOutlined,
  BellOutlined,
  PlusOutlined,
  HomeOutlined,
  FireOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined,
  RightOutlined,
  CommentOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

// Component Layout con để sử dụng được hooks của react-router-dom
const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = localStorage.getItem('user');
  const parsedUser = userData ? JSON.parse(userData) : null;

  const [searchVal, setSearchVal] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(true);

  const handleLogout = () => {
    localStorage.clear();
    message.success('Đăng xuất thành công!');
    navigate('/welcome');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleCreateQuestion = () => {
    if (!parsedUser) {
      navigate('/login');
    } else {
      navigate('/create-question');
    }
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
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: <span style={{ color: '#ef4444', fontWeight: 500 }}>Đăng xuất</span>,
      icon: <LogoutOutlined style={{ color: '#ef4444' }} />,
      onClick: handleLogout
    }
  ];

  // Các thẻ phổ biến ở Sidebar
  const sidebarTags = ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Node.js', 'Python', 'AI/ML', 'DevOps'];

  // Xác định active menu item dựa vào pathname
  const isHomeActive = location.pathname === '/' || location.pathname === '/welcome';
  const isPopularActive = location.search.includes('popular') || (location.pathname === '/search' && location.search.includes('tag=popular'));
  const isNewestActive = location.search.includes('newest');
  const isDiscussionsActive = location.pathname === '/discussions';

  const hideLayout = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* ==================== HEADER TRẮNG SANG TRỌNG ==================== */}
      {!hideLayout && (
      <Header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        height: '72px',
        background: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        {/* Logo bên trái */}
        <Link to={parsedUser ? '/' : '/welcome'} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '22px',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
          }}>
            D
          </div>
          <span style={{
            fontSize: '19px',
            fontWeight: '800',
            color: '#1e293b',
            letterSpacing: '-0.5px'
          }}>
            Diễn Đàn Công Nghệ
          </span>
        </Link>

        {/* Ô Tìm Kiếm ở giữa */}
        <form onSubmit={handleSearch} style={{ flex: '0 1 480px', margin: '0 20px' }}>
          <Input
            placeholder="Tìm kiếm câu hỏi, chủ đề..."
            prefix={<SearchOutlined style={{ color: '#94a3b8', marginRight: '4px' }} />}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="premium-search-input transition-all"
            style={{
              height: '42px',
              borderRadius: '999px',
              border: 'none',
              padding: '0 16px',
              fontSize: '14px'
            }}
          />
        </form>

        {/* Các nút bấm bên phải */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Nút đặt câu hỏi */}
          <button onClick={handleCreateQuestion} className="btn-action-primary transition-all">
            <PlusOutlined style={{ fontSize: '14px' }} />
            <span>Đặt câu hỏi</span>
          </button>

          {/* Chuông thông báo */}
          <Badge count={2} size="small" color="#ef4444" offset={[-2, 2]}>
            <div className="bell-icon-wrapper">
              <BellOutlined style={{ fontSize: '20px' }} />
            </div>
          </Badge>

          {/* Avatar / Nút đăng nhập */}
          {parsedUser ? (
            <Dropdown menu={{ items: avatarMenuItems }} trigger={['click']} placement="bottomRight">
              <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  size={40} 
                  style={{ 
                    backgroundColor: '#e0e7ff', 
                    color: '#6366f1', 
                    fontWeight: 600,
                    border: '2px solid #e2e8f0' 
                  }}
                  icon={!parsedUser.avatar && <UserOutlined />}
                  src={parsedUser.avatar}
                >
                  {parsedUser.username?.charAt(0).toUpperCase()}
                </Avatar>
                <div className="status-indicator-dot" />
              </div>
            </Dropdown>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="text" onClick={() => navigate('/login')} style={{ fontWeight: 500 }}>
                Đăng nhập
              </Button>
              <Button type="primary" onClick={() => navigate('/register')} style={{ borderRadius: '999px', fontWeight: 500 }}>
                Đăng ký
              </Button>
            </div>
          )}

        </div>
      </Header>
      )}

      {/* ==================== THÂN TRANG GỒM SIDEBAR TRÁI + MAIN CONTENT ==================== */}
      <Layout style={{ background: '#f8fafc' }}>
        
        {/* SIDEBAR TRÁI */}
        {!hideLayout && (
        <Sider 
          width={280} 
          theme="light"
          style={{
            background: 'transparent',
            borderRight: 'none',
            padding: '24px 16px',
            position: 'sticky',
            top: '72px',
            height: 'calc(100vh - 72px)',
            overflowY: 'auto'
          }}
        >
          {/* Section: Khám phá */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', padding: '0 16px 8px 16px' }}>
              KHÁM PHÁ
            </div>
            
            <div 
              className={`sidebar-nav-item ${isHomeActive ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              <HomeOutlined style={{ fontSize: '18px' }} />
              <span>Trang chủ</span>
            </div>

            <div 
              className={`sidebar-nav-item ${isDiscussionsActive ? 'active' : ''}`}
              onClick={() => navigate('/discussions')}
            >
              <CommentOutlined style={{ fontSize: '18px' }} />
              <span>Thảo luận cộng đồng</span>
            </div>

            <div 
              className={`sidebar-nav-item ${isPopularActive ? 'active' : ''}`}
              onClick={() => navigate('/search?q=popular')}
            >
              <FireOutlined style={{ fontSize: '18px' }} />
              <span>Câu hỏi phổ biến</span>
            </div>

            <div 
              className={`sidebar-nav-item ${isNewestActive ? 'active' : ''}`}
              onClick={() => navigate('/search?q=newest')}
            >
              <ClockCircleOutlined style={{ fontSize: '18px' }} />
              <span>Câu hỏi mới nhất</span>
            </div>
          </div>

          {/* Section: Tags phổ biến */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', padding: '0 16px 12px 16px' }}>
              TAGS PHỔ BIẾN
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 16px' }}>
              {sidebarTags.map(tag => (
                <div 
                  key={tag} 
                  className="sidebar-tag transition-all"
                  onClick={() => navigate(`/search?tag=${tag.toLowerCase()}`)}
                >
                  #{tag}
                </div>
              ))}
            </div>

            <div 
              style={{ 
                fontSize: '13px', 
                color: '#6366f1', 
                fontWeight: 600, 
                padding: '12px 16px 0 16px', 
                cursor: 'pointer', 
                display: 'inline-block' 
              }}
              onClick={() => navigate('/search')}
            >
              Xem tất cả thẻ
            </div>
          </div>

          {/* Section: Chuyên mục */}
          <div>
            <div className="category-dropdown-header transition-all" onClick={() => setCategoryOpen(!categoryOpen)}>
              <Space style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px' }}>
                CHUYÊN MỤC
              </Space>
              {categoryOpen ? <DownOutlined style={{ fontSize: '10px', color: '#94a3b8' }} /> : <RightOutlined style={{ fontSize: '10px', color: '#94a3b8' }} />}
            </div>

            {categoryOpen && (
              <div style={{ marginTop: '4px' }}>
                <div className="category-sub-item transition-all" onClick={() => navigate('/search?q=Web')}>Lập trình Web</div>
                <div className="category-sub-item transition-all" onClick={() => navigate('/search?q=Di động')}>Di động</div>
                <div className="category-sub-item transition-all" onClick={() => navigate('/search?q=Hệ điều hành')}>Hệ điều hành</div>
              </div>
            )}
          </div>
        </Sider>
        )}

        {/* MAIN CONTENT AREA */}
        <Content style={{ padding: hideLayout ? 0 : '24px 24px 40px 12px', minHeight: hideLayout ? '100vh' : 'calc(100vh - 72px)' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />   
            <Route path="/discussions" element={<DiscussionsPage />} />
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
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Content>

      </Layout>
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