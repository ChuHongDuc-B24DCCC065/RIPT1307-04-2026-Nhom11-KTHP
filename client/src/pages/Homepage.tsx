import React from 'react';
import { List, Tag, Space, Button, Row, Col, Typography, Card, message } from 'antd';
import { MessageOutlined, LikeOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Dữ liệu giả để test giao diện
const data = [
  {
    id: 1,
    title: 'Làm thế nào để cấu hình React Router trong Vite?',
    description: 'Mình đã cài đặt react-router-dom nhưng khi tải lại trang trên Netlify thì bị lỗi 404...',
    tags: ['reactjs', 'vite', 'frontend'],
    author: 'Chu Hong Duc',
    votes: 15,
    answers: 3,
    time: '2 giờ trước'
  },
  {
    id: 2,
    title: 'Cách kết nối Node.js với MySQL sử dụng Sequelize',
    description: 'Em đang làm bài tập lớn về diễn đàn, cần hướng dẫn kết nối database MySQL bằng Sequelize ORM.',
    tags: ['nodejs', 'mysql', 'backend'],
    author: 'SinhVienIT',
    votes: 8,
    answers: 1,
    time: '5 giờ trước'
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleCreateQuestion = () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đặt câu hỏi!');
      navigate('/login');
    } else {
      navigate('/create-question'); 
    }
  };


  return (
    <Row gutter={24}>
      {/* Cột trái: Danh sách câu hỏi */}
      <Col span={18}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Title level={2}>Câu hỏi mới nhất</Title>
          <Button type="primary" size="large" onClick={handleCreateQuestion}>Đặt câu hỏi</Button>
        </div>

        <List
          itemLayout="vertical"
          size="large"
          dataSource={data}
          renderItem={(item) => (
            <Card hoverable style={{ marginBottom: 16 }}>
              <List.Item
                key={item.id}
                actions={[
                  <Space><LikeOutlined /> {item.votes} Votes</Space>,
                  <Space><MessageOutlined /> {item.answers} Trả lời</Space>,
                  <Space><ClockCircleOutlined /> {item.time}</Space>,
                ]}
              >
                <List.Item.Meta
                  title={<a href={`/questions/${item.id}`} style={{ fontSize: 20 }}>{item.title}</a>}
                  description={
                    <Space split={<Text type="secondary">|</Text>}>
                      <Space><UserOutlined /> {item.author}</Space>
                    </Space>
                  }
                />
                <div style={{ marginBottom: 15 }}>{item.description}</div>
                <div>
                  {item.tags.map(tag => (
                    <Tag color="geekblue" key={tag} style={{ cursor: 'pointer' }}>#{tag}</Tag>
                  ))}
                </div>
              </List.Item>
            </Card>
          )}
        />
      </Col>

      {/* Cột phải: Sidebar thông tin thêm */}
      <Col span={6}>
      {user ? (
    <Card style={{ marginBottom: 20, textAlign: 'center', border: '1px solid #1890ff' }}>
      <UserOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 10 }} />
      <Title level={4}>Chào, {user.username}!</Title>
      <Text type="secondary">Vai trò: <Tag color="blue">{user.role}</Tag></Text>
      <Button 
        danger 
        block 
        style={{ marginTop: 15 }} 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
      >
        Đăng xuất
      </Button>
    </Card>
  ) : (
    <Card style={{ marginBottom: 20, textAlign: 'center' }}>
      <Title level={5}>Chào khách!</Title>
      <p>Đăng nhập để đặt câu hỏi nhé.</p>
      <Button type="primary" block onClick={() => navigate('/login')}>Đăng nhập</Button>
    </Card>
  )}

        <Card title="Thẻ phổ biến" style={{ marginBottom: 20 }}>
          <Space wrap>
            <Tag color="blue">javascript</Tag>
            <Tag color="blue">reactjs</Tag>
            <Tag color="blue">nodejs</Tag>
            <Tag color="blue">mysql</Tag>
            <Tag color="blue">typescript</Tag>
          </Space>
        </Card>

        <Card title="Thống kê">
          <p>Câu hỏi: <b>120</b></p>
          <p>Thành viên: <b>50</b></p>
          <p>Đang trực tuyến: <b>5</b></p>
        </Card>
      </Col>
    </Row>
  );
};

export default HomePage;