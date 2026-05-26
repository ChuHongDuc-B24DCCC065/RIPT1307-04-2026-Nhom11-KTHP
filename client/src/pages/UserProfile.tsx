import React, { useState, useEffect } from 'react';
import { 
  ConfigProvider, Typography, Form, Input, Button, Upload, 
  Row, Col, Space, Avatar, message, Flex, Divider, Card, Layout, Tabs, List, Image, Dropdown
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  UserOutlined, MailOutlined, LockOutlined, CameraOutlined, 
  SaveOutlined, SafetyCertificateOutlined, DownOutlined, ClockCircleOutlined,
  MessageOutlined, UserDeleteOutlined, InboxOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Content } = Layout;

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [user, setUser] = useState<Record<string, any> | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          const fetchedUser = res.data.data;
          setUser((prevUser: Record<string, any> | null) => {
            const newUser = { ...prevUser, ...fetchedUser };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
          });
          form.setFieldsValue({
            fullName: fetchedUser.fullName || fetchedUser.username,
            email: fetchedUser.email
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải profile:", error);
      }
    };
    if (user) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const onFinish = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`, {
        fullName: values.fullName,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      message.success('Cập nhật thông tin thành công!');
      
      const updatedUser = { ...user, fullName: values.fullName };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('storage'));
      
      form.setFieldsValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch {
      message.error("Không thể cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // --- MOCK DATA CHO CÁC TABS ---
  const activities = [
    { id: 1, content: 'Bạn đã đăng một câu hỏi: "Làm sao để cấu hình Ant Design v6?"', time: '2 giờ trước' },
    { id: 2, content: 'Bạn đã bình luận trong bài viết của Nguyễn Văn A', time: '5 giờ trước' },
    { id: 3, content: 'Bạn đã cập nhật ảnh đại diện mới', time: '1 ngày trước' }
  ];

  const photos = [
    'https://gw.alipayobjects.com/zos/antfincdn/LlvErxo8H9/photo-1503185912284-5271ff81b9a8.webp',
    'https://gw.alipayobjects.com/zos/antfincdn/cV16ZqzNwW/photo-1473091540282-9b846e7965e3.webp',
    'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    'https://broken-link-example.com/not-found.png' // Thêm một link hỏng để test fallback
  ];

  const friends = [
    { id: 1, name: 'Nguyễn Văn A', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1' },
    { id: 2, name: 'Trần Thị B', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2' },
    { id: 3, name: 'Lê Văn C', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=3' },
    { id: 4, name: 'Phạm Minh D', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=4' }
  ];

  const moreItems: MenuProps['items'] = [
    { key: '1', label: 'Bài viết đã lưu' },
    { key: '2', label: 'Cài đặt quyền riêng tư' },
    { key: '3', label: 'Cài đặt thông báo' }
  ];

  // Fallback image khi ảnh bị lỗi (placeholder mờ)
  const imageFallback = 'https://placehold.co/600x400/f0f2f5/a3a3a3?text=Image+Not+Found';

  // --- RENDER CONTENT CHO TỪNG TAB ---
  const renderAllTab = () => (
    <Card 
      styles={{ body: { padding: '32px' } }} 
      style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginTop: 24 }}
    >
      <Title level={4} style={{ marginBottom: 24 }}>Hoạt động gần đây</Title>
      <List
        rowKey="id"
        itemLayout="horizontal"
        dataSource={activities}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<ClockCircleOutlined />} style={{ backgroundColor: '#eef2ff', color: '#6366f1' }} />}
              title={<Text strong style={{ fontSize: 15 }}>{item.content}</Text>}
              description={item.time}
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const renderAboutTab = () => (
    <Card 
      styles={{ body: { padding: '32px' } }} 
      style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginTop: 24 }}
    >
      <div style={{ marginBottom: 40 }}>
        <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            backgroundColor: '#eef2ff', color: '#6366f1', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>
            <UserOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Thông tin cơ bản</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Quản lý thông tin cá nhân và hình ảnh đại diện của bạn</Text>
          </div>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item 
              name="fullName" 
              label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }}/>} size="large" placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="email" 
              label={<span style={{ fontWeight: 500 }}>Địa chỉ Email</span>}
              extra={<span style={{ fontSize: 13, color: '#94a3b8' }}>Email không thể thay đổi sau khi đăng ký</span>}
            >
              <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }}/>} size="large" disabled />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={<span style={{ fontWeight: 500 }}>Ảnh đại diện</span>}>
              <Dragger 
                name="file" 
                multiple={false} 
                action="/api/upload" 
                style={{ background: '#fafafa', borderColor: '#e2e8f0' }}
              >
                <Flex align="center" justify="space-between" style={{ padding: '8px 16px' }}>
                  <Flex align="center" gap="middle">
                    <div style={{ 
                      width: 48, height: 48, borderRadius: '50%', 
                      backgroundColor: '#eef2ff', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <InboxOutlined style={{ fontSize: 20, color: '#6366f1' }} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 500, fontSize: 16 }}>Nhấn để tải ảnh lên hoặc kéo thả vào đây</div>
                      <div style={{ color: '#64748b', fontSize: 14 }}>Hỗ trợ SVG, PNG, JPG (Tối đa 5MB)</div>
                    </div>
                  </Flex>
                  <Button>Chọn file</Button>
                </Flex>
              </Dragger>
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '40px 0' }} />

      <div>
        <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            backgroundColor: '#eef2ff', color: '#6366f1', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>
            <LockOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Đổi mật khẩu</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn</Text>
          </div>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item 
              name="currentPassword" 
              label={<span style={{ fontWeight: 500 }}>Mật khẩu hiện tại</span>}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="newPassword" 
              label={<span style={{ fontWeight: 500 }}>Mật khẩu mới</span>}
              rules={[
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="Nhập mật khẩu mới" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="confirmPassword" 
              label={<span style={{ fontWeight: 500 }}>Xác nhận mật khẩu mới</span>}
              dependencies={['newPassword']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value && !getFieldValue('newPassword')) {
                      return Promise.resolve();
                    }
                    if (!value) {
                      return Promise.reject(new Error('Vui lòng xác nhận mật khẩu mới!'));
                    }
                    if (getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>
          </Col>
        </Row>
      </div>
      
      <Divider style={{ margin: '32px 0 24px 0' }} />
      
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Space style={{ color: '#64748b', fontSize: 14 }}>
          <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: 18 }} />
          Mọi thay đổi sẽ được cập nhật tức thì sau khi lưu.
        </Space>
        <Space size="middle">
          <Button type="text" onClick={() => form.resetFields()} size="large">Hủy thay đổi</Button>
          <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SaveOutlined />}>Lưu thông tin</Button>
        </Space>
      </Flex>
    </Card>
  );

  const renderPhotosTab = () => (
    <Card 
      styles={{ body: { padding: '32px' } }} 
      style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginTop: 24 }}
    >
      <Title level={4} style={{ marginBottom: 24 }}>Ảnh của bạn ({photos.length})</Title>
      <Image.PreviewGroup>
        <Row gutter={[16, 16]}>
          {photos.map((url, index) => (
            <Col xs={12} sm={8} md={6} key={index}>
              <div style={{ borderRadius: 8, overflow: 'hidden', height: 160, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Image 
                  src={url} 
                  fallback={imageFallback}
                  width="100%" 
                  height="100%" 
                  style={{ objectFit: 'cover' }} 
                />
              </div>
            </Col>
          ))}
        </Row>
      </Image.PreviewGroup>
    </Card>
  );

  const renderFriendsTab = () => (
    <Card 
      styles={{ body: { padding: '32px' } }} 
      style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginTop: 24 }}
    >
      <Title level={4} style={{ marginBottom: 24 }}>Bạn bè ({friends.length})</Title>
      <List
        rowKey="id"
        grid={{ gutter: 16, column: 2, xs: 1, sm: 1, md: 2 }}
        dataSource={friends}
        renderItem={(item) => (
          <List.Item>
            <Card styles={{ body: { padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }} style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <Space size="middle">
                <Avatar src={item.avatar} size={56} style={{ border: '2px solid #eef2ff' }} />
                <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
              </Space>
              <Space size="middle">
                <Button type="primary" shape="circle" icon={<MessageOutlined />} />
                <Button danger type="text" shape="circle" icon={<UserDeleteOutlined />} />
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </Card>
  );

  const tabItems = [
    { key: '1', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Tất cả</span>, children: renderAllTab() },
    { key: '2', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Giới thiệu</span>, children: renderAboutTab() },
    { key: '3', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Ảnh</span>, children: renderPhotosTab() },
    { key: '4', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Bạn bè</span>, children: renderFriendsTab() },
    { 
      key: '5', 
      label: (
        <Dropdown menu={{ items: moreItems }} trigger={['hover']} placement="bottomRight">
          <Space style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>
            Xem thêm <DownOutlined style={{ fontSize: 12 }} />
          </Space>
        </Dropdown>
      )
    }
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6366f1', borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Content style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={onFinish}
              initialValues={{
                fullName: user.fullName || user.username,
                email: user.email
              }}
            >
              {/* Vùng chứa Header và Tabs Bar */}
              <div style={{ background: '#ffffff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                
                {/* Top Banner */}
                <div style={{ 
                  height: 180, 
                  background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', 
                  position: 'relative'
                }} />
                
                <Flex align="flex-end" style={{ padding: '0 32px 24px 32px', marginTop: -60, position: 'relative', zIndex: 1 }}>
                  <Flex gap="large" align="flex-end">
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                      <Avatar 
                        size={130} 
                        icon={<UserOutlined />} 
                        src={user.avatar}
                        style={{ border: '4px solid #ffffff', backgroundColor: '#f0f0f0', color: '#ccc' }} 
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        border: '2px solid #ffffff'
                      }}>
                        <CameraOutlined style={{ fontSize: 16 }} />
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ paddingBottom: 16, marginTop: 60 }}>
                      <Title level={2} style={{ margin: 0, marginBottom: 8, fontWeight: 700, lineHeight: 1.2 }}>
                        {user.fullName || user.username}
                      </Title>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                        <MailOutlined />
                        <Text style={{ color: '#64748b' }}>{user.email || 'Chưa cập nhật email'}</Text>
                      </div>
                    </div>
                  </Flex>
                </Flex>

                <Divider style={{ margin: 0, borderColor: '#f0f0f0' }} />

                {/* Tabs Bar */}
                <ConfigProvider 
                  theme={{ 
                    components: { 
                      Tabs: { 
                        itemColor: '#64748b', 
                        itemHoverColor: '#1e293b', 
                        itemActiveColor: '#1877f2', 
                        inkBarColor: '#1877f2',
                      } 
                    } 
                  }}
                >
                  <Tabs 
                    defaultActiveKey="1"
                    items={tabItems}
                    renderTabBar={(props, DefaultTabBar) => (
                      <div style={{ padding: '0 32px' }}>
                        <DefaultTabBar {...props} style={{ borderBottom: 'none', margin: 0 }} />
                      </div>
                    )}
                  />
                </ConfigProvider>
              </div>
            </Form>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default UserProfile;