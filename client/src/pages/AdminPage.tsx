import React, { useState, useEffect } from 'react';
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
  MailOutlined
} from '@ant-design/icons';
import axios from 'axios';
import AdminDashboard from './AdminDashboard';
import AdminEmailBroadcast from './AdminEmailBroadcast';
import AdminPostManagement from './AdminPostManagement';
import AdminUserManagement from './AdminUserManagement';

const { Header, Content, Sider } = Layout;



const AdminPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<string>('1');

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




  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '2', icon: <UserOutlined />, label: 'Người dùng' },
    { key: '3', icon: <FileTextOutlined />, label: 'Bài viết' },
    { key: '4', icon: <MailOutlined />, label: 'Gửi Thông báo' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 6 }} />
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[selectedMenu]} 
          items={menuItems} 
          onSelect={({ key }) => setSelectedMenu(key)}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
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
            
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPage;