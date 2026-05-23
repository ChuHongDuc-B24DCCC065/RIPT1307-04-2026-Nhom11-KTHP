import React from 'react';
import { Form, Input, Button, Card, message, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const { Option } = Select;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/register`, values);
      message.success('Đăng ký thành công!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      message.error(err.response?.data || 'Đăng ký thất bại');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
      <Card title="ĐĂNG KÝ TÀI KHOẢN" style={{ width: 450 }}>
        <Form onFinish={onFinish} layout="vertical" initialValues={{ role: 'student' }}>
          
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email sinh viên/giảng viên" />
          </Form.Item>

          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          {/* Ô CHỌN ROLE KHỚP VỚI DATABASE */}
          <Form.Item name="role" label="Bạn là:" rules={[{ required: true }]}>
            <Select prefix={<TeamOutlined />}>
              <Option value="student">Sinh viên</Option>
              <Option value="teacher">Giảng viên</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Tạo tài khoản
          </Button>

          <div style={{ marginTop: 15, textAlign: 'center' }}>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;