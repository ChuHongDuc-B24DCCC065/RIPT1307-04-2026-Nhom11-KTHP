import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>Đặt lại mật khẩu</Title>
          <Paragraph type="secondary" style={{ marginTop: 4, fontSize: '13px' }}>
            Vui lòng nhập mật khẩu mới
          </Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="newPassword" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Mật khẩu mới</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Mật khẩu tối thiểu 6 ký tự" 
              size="large" 
              style={{ borderRadius: '10px' }}
            />
          </Form.Item>

          <Form.Item 
            name="confirmPassword" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Xác nhận mật khẩu</span>} 
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
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Nhập lại mật khẩu" 
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
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
