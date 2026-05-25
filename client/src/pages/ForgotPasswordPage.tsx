import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

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
      // Lưu ý: Trong thực tế token sẽ được gửi qua email. Ở đây API đang trả về trực tiếp để test.
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
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>Quên mật khẩu</Title>
          <Paragraph type="secondary" style={{ marginTop: 4, fontSize: '13px' }}>
            Nhập email của bạn để lấy lại mật khẩu
          </Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="email" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Email</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' }, 
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Nhập email của bạn" 
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
              loading={loading}
              style={{ 
                borderRadius: '10px', 
                height: '44px',
                fontWeight: 600, 
                background: '#6366f1', 
                borderColor: '#6366f1',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
              }}
            >
              Gửi yêu cầu
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: '13.5px' }}>
          Nhớ mật khẩu rồi? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Quay lại đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
