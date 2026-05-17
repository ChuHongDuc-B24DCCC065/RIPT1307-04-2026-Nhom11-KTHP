import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Avatar, Button, Tabs, List, Space, Tag, Modal, Form, Input, message } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, MailOutlined, IdcardOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Dữ liệu giả tương tự các trang khác để đồng bộ giao diện
const questionsData = [
  {
    id: 1,
    title: 'Làm thế nào để cấu hình React Router trong Vite?',
    description: 'Mình đã cài đặt react-router-dom nhưng khi tải lại trang trên Netlify thì bị lỗi 404. Mình đã thử thêm file _redirects nhưng vẫn không được. Có ai gặp trường hợp này chưa ạ?',
    tags: ['reactjs', 'vite', 'frontend'],
    author: 'Chu Hong Duc',
    votes: 15,
    answers: 3,
    time: '2 giờ trước'
  },
  {
    id: 2,
    title: 'Cách kết nối Node.js với MySQL sử dụng Sequelize',
    description: 'Em đang làm bài tập lớn về diễn đàn, cần hướng dẫn kết nối database MySQL bằng Sequelize ORM. Em đã cài đặt các package cần thiết nhưng khi chạy thì báo lỗi dialect not specified.',
    tags: ['nodejs', 'mysql', 'backend'],
    author: 'SinhVienIT',
    votes: 8,
    answers: 1,
    time: '5 giờ trước'
  },
];

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // Lọc danh sách câu hỏi của chính người dùng (ở bản demo này dùng username để lọc)
  // Nếu user là "Chu Hong Duc" (admin/mock), sẽ thấy bài viết mẫu đầu tiên
  const myQuestions = questionsData.filter(q => q.author === user.username || (user.username === 'admin' && q.author === 'Chu Hong Duc'));

  const handleUpdateProfile = (values: any) => {
    const updatedUser = { ...user, ...values };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    message.success('Cập nhật thông tin thành công!');
    setIsEditModalVisible(false);
    
    // Refresh trang hoặc cập nhật state cục bộ để UI đồng bộ
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteQuestion = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        message.success(`Đã xóa câu hỏi thành công!`);
        // Trong thực tế sẽ gọi API DELETE ở đây
      }
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Row gutter={24}>
        {/* Cột trái: Thông tin cá nhân */}
        <Col xs={24} md={8}>
          <Card 
            bordered={false}
            className="profile-card"
            cover={
              <div style={{ height: 120, background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)', borderRadius: '8px 8px 0 0' }} />
            }
            style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' }}
          >
            <Avatar 
              size={100} 
              icon={<UserOutlined />} 
              style={{ 
                marginTop: -50, 
                border: '4px solid white', 
                backgroundColor: '#f56a00',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }} 
            />
            <Title level={3} style={{ marginTop: 15, marginBottom: 5 }}>{user.username}</Title>
            <Tag color={user.role === 'teacher' ? 'magenta' : 'blue'} style={{ marginBottom: 20 }}>
              {user.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}
            </Tag>
            
            <div style={{ textAlign: 'left', marginTop: 20, padding: '0 10px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><MailOutlined /> EMAIL</Text>
                  <Text strong>{user.email || 'chua_cap_nhat@example.com'}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><IdcardOutlined /> HỌ TÊN</Text>
                  <Text strong>{user.fullName || user.username}</Text>
                </div>
              </Space>
              
              <Button 
                type="primary" 
                block 
                icon={<EditOutlined />} 
                style={{ marginTop: 30, height: '40px', borderRadius: '6px' }}
                onClick={() => {
                  form.setFieldsValue({
                    fullName: user.fullName || user.username,
                    email: user.email || ''
                  });
                  setIsEditModalVisible(true);
                }}
              >
                Chỉnh sửa hồ sơ
              </Button>
            </div>
          </Card>
        </Col>

        {/* Cột phải: Danh sách câu hỏi và Hoạt động */}
        <Col xs={24} md={16}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <Tabs defaultActiveKey="1" size="large">
              <TabPane 
                tab={
                  <span>
                    <MessageOutlined /> Câu hỏi của tôi
                  </span>
                } 
                key="1"
              >
                <List
                  itemLayout="vertical"
                  size="large"
                  dataSource={myQuestions}
                  locale={{ emptyText: 'Bạn chưa đăng câu hỏi nào.' }}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      style={{ padding: '20px 0' }}
                      actions={[
                        <Space><MessageOutlined /> {item.answers} Trả lời</Space>,
                        <Space><ClockCircleOutlined /> {item.time}</Space>,
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => navigate(`/edit-question/${item.id}`)}
                          style={{ color: '#1890ff' }}
                        >
                          Sửa
                        </Button>,
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteQuestion(item.id)}
                        >
                          Xóa
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Link to={`/questions/${item.id}`} style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            {item.title}
                          </Link>
                        }
                        description={
                          <Space wrap>
                            {item.tags.map(tag => <Tag key={tag} color="geekblue">#{tag}</Tag>)}
                          </Space>
                        }
                      />
                      <div style={{ color: '#555', marginTop: 10 }}>
                        {item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
                      </div>
                    </List.Item>
                  )}
                />
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <ClockCircleOutlined /> Hoạt động gần đây
                  </span>
                } 
                key="2"
              >
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Text type="secondary">Tính năng đang được phát triển...</Text>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Modal Chỉnh sửa hồ sơ */}
      <Modal
        title="Cập nhật thông tin cá nhân"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={{
            fullName: user.fullName || user.username,
            email: user.email || ''
          }}
        >
          <Form.Item 
            name="fullName" 
            label="Họ và tên" 
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ và tên đầy đủ" size="large" />
          </Form.Item>
          
          <Form.Item 
            name="email" 
            label="Email" 
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input placeholder="example@student.ptit.edu.vn" size="large" />
          </Form.Item>
          
          <Form.Item label="Tên đăng nhập (Mặc định)">
            <Input value={user.username} disabled size="large" />
          </Form.Item>
          
          <Form.Item label="Vai trò">
            <Tag color={user.role === 'teacher' ? 'magenta' : 'blue'}>
              {user.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}
            </Tag>
          </Form.Item>
          
          <div style={{ textAlign: 'right', marginTop: 30 }}>
            <Button onClick={() => setIsEditModalVisible(false)} style={{ marginRight: 10 }}>
              Hủy bỏ
            </Button>
            <Button type="primary" htmlType="submit" size="large">
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
