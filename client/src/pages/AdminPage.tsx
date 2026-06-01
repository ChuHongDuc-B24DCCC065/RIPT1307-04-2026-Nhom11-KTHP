import React, { useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  message, 
  theme 
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  DashboardOutlined,
  MailOutlined,
  TagOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import AdminEmailBroadcast from './AdminEmailBroadcast';
import AdminPostManagement from './AdminPostManagement';
import AdminUserManagement from './AdminUserManagement';
import AdminTagManagement from './AdminTagManagement';

const { Content, Sider } = Layout;



const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine selectedMenu based on pathname
  let selectedMenu = '1';
  if (location.pathname === '/admin/users') {
    selectedMenu = '2';
  } else if (location.pathname === '/admin/posts') {
    selectedMenu = '3';
  } else if (location.pathname === '/admin/broadcast') {
    selectedMenu = '4';
  } else if (location.pathname === '/admin/tags') {
    selectedMenu = '5';
  }

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  // Tạo axios instance với interceptor
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  });

  // Interceptor để tự động thêm token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
      return Promise.reject(error);
    }
  );

  const fetchData = async () => {
    try {
      // Dữ liệu dùng chung có thể fetch ở đây nếu cần,
      // hiện tại các component con tự xử lý dữ liệu của chúng.
      
    } catch (error: any) {
      console.error('Fetch data error:', error);
      if (error.response?.status !== 401) {
        message.error("Lỗi kết nối server!");
      }
    }
  };

  useEffect(() => {
  // Kiểm tra token và user info
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  console.log('Token:', token);
  console.log('User:', userStr);
  
  if (!token) {
    message.error('Vui lòng đăng nhập lại!');
    window.location.href = '/login';
    return;
  }
  
  // Giải mã token xem có role admin không
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    console.log('Decoded token:', decoded);
    
    if (decoded.role !== 'admin') {
      message.error('Bạn không có quyền truy cập trang Admin!');
      window.location.href = '/';
      return;
    }
  } catch (error) {
    console.error('Lỗi decode token:', error);
  }
  
  fetchData();
}, []);

  // Redirect from /admin to /admin/dashboard
  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);




  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '2', icon: <UserOutlined />, label: 'Người dùng' },
    { key: '3', icon: <FileTextOutlined />, label: 'Bài viết' },
    { key: '4', icon: <MailOutlined />, label: 'Gửi Thông báo' },
    { key: '5', icon: <TagOutlined />, label: 'Quản lý Thẻ' },
  ];

  return (
    <Layout style={{ minHeight: 'calc(100vh - 72px)' }}>
      <Sider 
        breakpoint="lg" 
        collapsedWidth="0"
        theme="light"
        className="admin-sider"
        style={{ borderRight: '1px solid #f1f5f9' }}
      >
        <div style={{ 
          height: 48, 
          margin: '16px 16px 24px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)', 
          borderRadius: 8,
          color: '#4f46e5',
          fontWeight: 800,
          fontSize: '15px',
          letterSpacing: '0.5px',
          boxShadow: '0 2px 4px rgba(99, 102, 241, 0.05)'
        }}>
          ADMIN PANEL
        </div>
        <Menu 
          theme="light" 
          mode="inline" 
          selectedKeys={[selectedMenu]} 
          items={menuItems} 
          onSelect={({ key }) => {
            if (key === '1') navigate('/admin/dashboard');
            else if (key === '2') navigate('/admin/users');
            else if (key === '3') navigate('/admin/posts');
            else if (key === '4') navigate('/admin/broadcast');
            else if (key === '5') navigate('/admin/tags');
          }}
          style={{ borderRight: 'none' }}
        />
      </Sider>

      <Layout>
        <Content style={{ margin: '24px 16px' }}>
          <div style={{ 
            padding: selectedMenu === '1' ? 0 : 24, 
            background: selectedMenu === '1' ? 'transparent' : colorBgContainer, 
            borderRadius: borderRadiusLG,
            minHeight: '80vh'
          }}>
            {selectedMenu === '1' && <AdminDashboard />}
            
            {selectedMenu === '2' && <AdminUserManagement />}

            {selectedMenu === '3' && <AdminPostManagement />}

            {selectedMenu === '4' && <AdminEmailBroadcast />}
            
            {selectedMenu === '5' && <AdminTagManagement />}
            
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPage;