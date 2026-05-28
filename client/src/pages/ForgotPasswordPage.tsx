import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPasswordPage.css';

const { Title, Paragraph } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/forgot-password`, {
        email: values.email
      });
      message.success(res.data.message || 'Yêu cầu lấy lại mật khẩu thành công!');
      
      // Chuyển hướng sang trang reset password kèm theo email và token
      if (res.data.token) {
        navigate(`/reset-password?email=${encodeURIComponent(values.email)}&token=${res.data.token}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data || 'Không thể gửi yêu cầu quên mật khẩu!';
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Đã có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Dynamic gradient background glows */}
      <div className="auth-bg-glow-1"></div>
      <div className="auth-bg-glow-2"></div>

      <Card bordered={false} className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">D</div>
          <Title level={3} className="auth-title">Quên mật khẩu</Title>
          <Paragraph className="auth-subtitle">
            Nhập email của bạn để lấy lại mật khẩu
          </Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="email" 
            label={<span className="auth-form-label">Email</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' }, 
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="user@example.com" 
              size="large" 
              className="auth-input-wrapper"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
              className="auth-submit-btn"
            >
              Gửi yêu cầu
            </Button>
          </Form.Item>
        </Form>
        
        <div className="auth-footer">
          Nhớ mật khẩu rồi? <Link to="/login" className="auth-footer-link">Quay lại đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
