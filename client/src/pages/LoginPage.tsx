import React from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/login`, {
        email: values.username,
        password: values.password
      });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        message.success(`Chào mừng ${res.data.user.username} quay trở lại!`);

        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
        window.location.reload();
      }
      
    } catch (err: any) {
      const errorMsg = err.response?.data || 'Tài khoản hoặc mật khẩu không đúng!';
      message.error(errorMsg);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '20px' }}>
      <Card 
        bordered={false}
        style={{ 
          width: 420, 
          boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.08), 0 8px 12px -6px rgba(0, 0, 0, 0.02)',
          borderRadius: '20px',
          border: '1px solid #f1f5f9'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '26px',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
            marginBottom: '16px'
          }}>
            D
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>Đăng nhập hệ thống</Title>
          <Paragraph type="secondary" style={{ marginTop: 4, fontSize: '13px' }}>Kết nối với cộng đồng sinh viên công nghệ</Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="username" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Email</span>}
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Ví dụ: sinhvien@ptit.edu.vn" 
              size="large" 
              style={{ borderRadius: '10px' }}
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Nhập mật khẩu" 
              size="large" 
              style={{ borderRadius: '10px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              style={{ 
                borderRadius: '10px', 
                height: '44px',
                fontWeight: 600, 
                background: '#6366f1', 
                borderColor: '#6366f1',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
              }}
            >
              Đăng nhập ngay
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: '13.5px' }}>
          Bạn chưa có tài khoản? <Link to="/register" style={{ color: '#6366f1', fontWeight: 600 }}>Đăng ký ngay</Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;