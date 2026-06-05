import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPasswordPage.css';

const { Title, Paragraph } = Typography;

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const onFinish = async (values: any) => {
    if (!email || !token) {
      message.error('Đường dẫn không hợp lệ hoặc đã hết hạn!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reset-password`, {
        email,
        token,
        newPassword: values.newPassword
      });
      message.success(res.data.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data || 'Không thể đặt lại mật khẩu!';
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

      <Card variant="borderless" className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">D</div>
          <Title level={3} className="auth-title">Đặt lại mật khẩu</Title>
          <Paragraph className="auth-subtitle">
            Vui lòng nhập mật khẩu mới của bạn
          </Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="newPassword" 
            label={<span className="auth-form-label">Mật khẩu mới</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu tối thiểu 6 ký tự" 
              size="large" 
              className="auth-input-wrapper"
            />
          </Form.Item>

          <Form.Item 
            name="confirmPassword" 
            label={<span className="auth-form-label">Xác nhận mật khẩu</span>} 
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập lại mật khẩu" 
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
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
