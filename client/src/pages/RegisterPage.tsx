import React from 'react';
import { Form, Input, Button, Card, message, Select, Typography, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      const { lastName, firstName, ...rest } = values;
      const payload = {
        ...rest,
        username: `${lastName || ''} ${firstName || ''}`.trim(),
      };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/register`, payload);
      message.success('Đăng ký tài khoản thành công!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data || 'Đăng ký thất bại. Vui lòng thử lại!';
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Đăng ký thất bại. Vui lòng thử lại!');
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
          <Title level={3} className="auth-title">Đăng ký tài khoản</Title>
          <Paragraph className="auth-subtitle">Tham gia cộng đồng sinh viên trao đổi tri thức</Paragraph>
        </div>

        <Form onFinish={onFinish} layout="vertical" initialValues={{ role: 'student' }}>
          
          <Form.Item 
            label={<span className="auth-form-label">Tên</span>} 
            required
            style={{ marginBottom: 0 }}
          >
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="lastName"
                  rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="Họ" 
                    size="large"
                    className="auth-input-wrapper"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="firstName"
                  rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="Tên" 
                    size="large"
                    className="auth-input-wrapper"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item 
            name="email" 
            label={<span className="auth-form-label">Email</span>} 
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email sinh viên hoặc giảng viên" 
              size="large"
              className="auth-input-wrapper"
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            label={<span className="auth-form-label">Mật khẩu</span>} 
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' }]}
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
              prefix={<LockOutlined />} 
              placeholder="Nhập lại mật khẩu" 
              size="large"
              className="auth-input-wrapper"
            />
          </Form.Item>

          <Form.Item 
            name="role" 
            label={<span className="auth-form-label">Bạn là:</span>} 
            rules={[{ required: true }]}
          >
            <Select 
              size="large" 
              className="auth-select-wrapper" 
              suffixIcon={<TeamOutlined style={{ color: '#94a3b8' }} />}
            >
              <Option value="student">Sinh viên</Option>
              <Option value="teacher">Giảng viên</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              className="auth-submit-btn"
            >
              Tạo tài khoản
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login" className="auth-footer-link">Đăng nhập ngay</Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;