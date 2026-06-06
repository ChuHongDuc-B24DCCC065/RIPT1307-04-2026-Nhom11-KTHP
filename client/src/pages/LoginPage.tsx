import React from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

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
      const errorMsg = err.response?.data?.message || err.response?.data || 'Tài khoản hoặc mật khẩu không đúng!';
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Tài khoản hoặc mật khẩu không đúng!');
    }
  };

  return (
    <div className="auth-page-container">
      {/* Dynamic gradient background glows */}
      <div className="auth-bg-glow-1"></div>
      <div className="auth-bg-glow-2"></div>

      <Card variant="borderless" className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">D</div>
          <Title level={3} className="auth-title">Chào mừng trở lại</Title>
          <Paragraph className="auth-subtitle">Vui lòng nhập thông tin của bạn để tiếp tục</Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="username" 
            label={<span className="auth-form-label">Email</span>}
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="user@example.com" 
              size="large" 
              className="auth-input-wrapper"
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            label={<span className="auth-form-label">Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="password123" 
              size="large" 
              className="auth-input-wrapper"
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: -12, marginBottom: 20 }}>
            <Link to="/forgot-password" className="forgot-password-link">Quên mật khẩu?</Link>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              className="auth-submit-btn"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
        
        <div className="auth-divider-container">
          <div className="auth-divider-line"></div>
          <div className="auth-divider-text">Hoặc tiếp tục với</div>
          <div className="auth-divider-line"></div>
        </div>

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register" className="auth-footer-link">Đăng ký ngay</Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;