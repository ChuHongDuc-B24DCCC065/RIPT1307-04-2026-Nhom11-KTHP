import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

interface EditProfileModalProps {
  user: any;
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: (updatedUser: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isVisible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isVisible && user) {
      form.setFieldsValue({
        fullName: user.fullName || user.username,
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        school: user.school || '',
        bio: user.bio || '',
        website: user.website || ''
      });
    }
  }, [isVisible, user, form]);

  const handleUpdateProfile = async (values: any) => {
    try {
      const token = localStorage.getItem('token');
      // Gọi API cập nhật profile lên Backend
      await axios.put('http://localhost:5000/api/users/profile', values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = { ...user, ...values };
      message.success('Cập nhật thông tin thành công!');
      onSuccess(updatedUser);
    } catch (error) {
      message.error("Không thể cập nhật thông tin lên server!");
    }
  };

  return (
    <Modal
      title="Cập nhật thông tin cá nhân"
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdateProfile}
      >
        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
          <Input placeholder="Nhập họ và tên đầy đủ" size="large" />
        </Form.Item>
        
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}>
          <Input placeholder="example@student.ptit.edu.vn" size="large" />
        </Form.Item>
        
        <Form.Item name="phoneNumber" label="Số điện thoại">
          <Input placeholder="Nhập số điện thoại" size="large" />
        </Form.Item>
        
        <Form.Item name="school" label="Trường học">
          <Input placeholder="Nhập tên trường học" size="large" />
        </Form.Item>

        <Form.Item name="bio" label="Giới thiệu bản thân">
          <Input.TextArea placeholder="Vài nét về bản thân..." rows={3} size="large" />
        </Form.Item>

        <Form.Item name="website" label="Link Website">
          <Input placeholder="https://yourwebsite.com" size="large" />
        </Form.Item>

        <Form.Item label="Tên đăng nhập (Mặc định)">
          <Input value={user?.username} disabled size="large" />
        </Form.Item>
        
        <div style={{ textAlign: 'right', marginTop: 30 }}>
          <Button onClick={onCancel} style={{ marginRight: 10 }}>Hủy bỏ</Button>
          <Button type="primary" htmlType="submit" size="large">Lưu thay đổi</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
