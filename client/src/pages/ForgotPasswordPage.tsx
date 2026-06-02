import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPasswordPage.css';

const { Title, Paragraph } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/forgot-password`, {
        email: values.email
      });
      message.success(res.data.message || 'Yêu cầu lấy lại mật khẩu thành công!');
      setSubmitted(true);
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

        {submitted ? (
          <Result
            status="success"
            title="Đã ghi nhận yêu cầu"
            subTitle="Yêu cầu đặt lại mật khẩu đã được ghi nhận. Vui lòng kiểm tra hộp thư Email của bạn để nhận liên kết xác nhận."
            extra={[
              <Button 
                type="primary" 
                key="back" 
                size="large" 
                onClick={() => navigate('/login')} 
                className="auth-submit-btn"
                style={{ width: '100%' }}
              >
                Quay lại đăng nhập
              </Button>
            ]}
          />
        ) : (
          <>
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
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
