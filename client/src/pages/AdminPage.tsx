import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Card, 
  Col, 
  Row, 
  Statistic, 
  Tabs, 
  Table, 
  Button, 
  Popconfirm, 
  message, 
  theme 
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  DashboardOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import AdminDashboard from './AdminDashboard';
import ToggleUserStatusButton from '../components/ToggleUserStatusButton';

const { Header, Content, Sider } = Layout;

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status?: string;
}

interface Post {
  id: string;
  title: string;
  author: string;
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<string>('1');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, reports: 0 });

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
    setLoading(true);
    
    try {
      const [usersRes, postsRes, statsRes] = await Promise.all([
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/posts'),
        axiosInstance.get('/admin/stats'),
      ]);

      setUsers(usersRes.data.users || []);
      setPosts(postsRes.data.posts || []);
      setStats(statsRes.data);
      
    } catch (error: any) {
      console.error('Fetch data error:', error);
      if (error.response?.status !== 401) {
        message.error("Lỗi kết nối server!");
      }
    } finally {
      setLoading(false);
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

  // Xử lý xóa post
  const handleDeletePost = async (postId: string) => {
    try {
      await axiosInstance.delete(`/admin/posts/${postId}`);
      message.success('Xóa bài viết thành công!');
      fetchData(); // Refresh data
    } catch (error) {
      message.error('Xóa thất bại!');
    }
  };


  // Menu items theo chuẩn AntD v5
  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '2', icon: <UserOutlined />, label: 'Người dùng' },
    { key: '3', icon: <FileTextOutlined />, label: 'Bài viết' },
  ];

  const userColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' }, 
    { title: 'Tên tài khoản', dataIndex: 'username', key: 'username' }, 
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'banned' ? 'red' : 'green' }}>
          {status === 'banned' ? 'Banned' : 'Active'}
        </span>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: User) => (
        <ToggleUserStatusButton 
          userId={record.id} 
          currentStatus={record.status} 
          onSuccess={fetchData} 
        />
      ),
    },
  ];

  const postColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Tác giả', dataIndex: 'author', key: 'author' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Post) => (
        <Popconfirm 
          title="Xóa bài viết này?" 
          onConfirm={() => handleDeletePost(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>Xóa</Button>
        </Popconfirm>
      ),
    },
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
            
            {selectedMenu === '2' && (
              <>
                <h2 style={{ marginBottom: 24 }}>Quản lý người dùng</h2>
                <Table columns={userColumns} dataSource={users} rowKey="id" loading={loading} />
              </>
            )}

            {selectedMenu === '3' && (
              <>
                <h2 style={{ marginBottom: 24 }}>Quản lý bài viết</h2>
                <Table columns={postColumns} dataSource={posts} rowKey="id" loading={loading} />
              </>
            )}
            
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPage;