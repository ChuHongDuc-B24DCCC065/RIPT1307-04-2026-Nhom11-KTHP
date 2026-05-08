import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      
      const res = await axios.post('http://localhost:5000/api/login', {
        email: values.username, 
        password: values.password
      });

      // Nếu Server trả về token (đăng nhập thành công)
      if (res.data.token) {
        // 1. Lưu Token và thông tin User vào localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        message.success(`Chào mừng ${res.data.user.username} quay trở lại!`);

        // 2. Điều hướng về trang chủ
        navigate('/');
        
        // 3. Mẹo nhỏ: Force reload nhẹ để Navbar cập nhật trạng thái "Đã đăng nhập" 
        // Hoặc bạn có thể dùng Context API/Redux để quản lý state này xịn hơn.
        navigate('/HomePage');
      }
      
    } catch (err: any) {
      // Lấy thông báo lỗi cụ thể từ Server nếu có (ví dụ: "Mật khẩu sai")
      const errorMsg = err.response?.data || 'Tài khoản hoặc mật khẩu không đúng!';
      message.error(errorMsg);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card 
        title={<div style={{ textAlign: 'center' }}>ĐĂNG NHẬP HỆ THỐNG</div>} 
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="username" 
            label="Email"
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ví dụ: sv@ptit.edu.vn" size="large" />
          </Form.Item>

          <Form.Item 
            name="password" 
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Đăng nhập ngay
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center' }}>
          Bạn chưa có tài khoản? <Link to="/register" style={{ fontWeight: 'bold' }}>Đăng ký ngay</Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;