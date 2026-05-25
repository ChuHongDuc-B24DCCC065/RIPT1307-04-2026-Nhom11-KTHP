import React from 'react';
import { Form, Input, Button, Card, message, Select, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/register`, values);
      message.success('Đăng ký tài khoản thành công!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data || 'Đăng ký thất bại. Vui lòng thử lại!';
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Đăng ký thất bại. Vui lòng thử lại!');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '20px' }}>
      <Card 
        bordered={false}
        style={{ 
          width: 440, 
          boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.08), 0 8px 12px -6px rgba(0, 0, 0, 0.02)',
          borderRadius: '20px',
          border: '1px solid #f1f5f9'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>Đăng ký tài khoản</Title>
          <Paragraph type="secondary" style={{ marginTop: 4, fontSize: '13px' }}>Tham gia cộng đồng sinh viên trao đổi tri thức</Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical" initialValues={{ role: 'student' }}>
          
          <Form.Item 
            name="username" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Tên đăng nhập</span>} 
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Username" 
              size="large"
              style={{ borderRadius: '10px' }}
            />
          </Form.Item>

          <Form.Item 
            name="email" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Email</span>} 
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Email sinh viên hoặc giảng viên" 
              size="large"
              style={{ borderRadius: '10px' }}
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Mật khẩu</span>} 
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' }]}
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
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
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

          <Form.Item 
            name="role" 
            label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Bạn là:</span>} 
            rules={[{ required: true }]}
          >
            <Select size="large" style={{ width: '100%' }} suffixIcon={<TeamOutlined style={{ color: '#94a3b8' }} />}>
              <Option value="student">Sinh viên</Option>
              <Option value="teacher">Giảng viên</Option>
            </Select>
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
              Tạo tài khoản ngay
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: '13.5px' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Đăng nhập ngay</Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;