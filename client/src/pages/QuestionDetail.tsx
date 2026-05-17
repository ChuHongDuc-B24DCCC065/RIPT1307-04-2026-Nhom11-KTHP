import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Space, Button, Divider, List, Avatar, Input, message, Row, Col } from 'antd';
import { 
  LikeOutlined, 
  LikeFilled,
  MessageOutlined, 
  UserOutlined, 
  ClockCircleOutlined, 
  ArrowLeftOutlined,
  SendOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Dữ liệu giả tương tự Homepage để hiển thị đúng thông tin theo ID
const questionsData = [
  {
    id: 1,
    title: 'Làm thế nào để cấu hình React Router trong Vite?',
    description: 'Mình đã cài đặt react-router-dom nhưng khi tải lại trang trên Netlify thì bị lỗi 404. Mình đã thử thêm file _redirects nhưng vẫn không được. Có ai gặp trường hợp này chưa ạ?',
    tags: ['reactjs', 'vite', 'frontend'],
    author: 'Chu Hong Duc',
    votes: 15,
    answers: 3,
    time: '2 giờ trước',
    comments: [
      {
        id: 101,
        author: 'Nguyen Van A',
        content: 'Bạn kiểm tra lại file netlify.toml xem đã cấu hình redirect đúng chưa nhé.',
        time: '1 giờ trước'
      },
      {
        id: 102,
        author: 'Tran Thi B',
        content: 'Nếu dùng Vite, hãy chắc chắn rằng bạn đã build đúng thư mục dist.',
        time: '30 phút trước'
      }
    ]
  },
  {
    id: 2,
    title: 'Cách kết nối Node.js với MySQL sử dụng Sequelize',
    description: 'Em đang làm bài tập lớn về diễn đàn, cần hướng dẫn kết nối database MySQL bằng Sequelize ORM. Em đã cài đặt các package cần thiết nhưng khi chạy thì báo lỗi dialect not specified.',
    tags: ['nodejs', 'mysql', 'backend'],
    author: 'SinhVienIT',
    votes: 8,
    answers: 1,
    time: '5 giờ trước',
    comments: [
      {
        id: 201,
        author: 'Admin',
        content: 'Bạn cần khai báo dialect: "mysql" trong cấu hình của Sequelize nhé.',
        time: '4 giờ trước'
      }
    ]
  },
];

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Khai báo state commentText (Chỉ giữ lại 1 lần duy nhất ở đây)
  const [commentText, setCommentText] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Tìm câu hỏi theo ID
  const question = questionsData.find(q => q.id === Number(id));

  const [votes, setVotes] = useState(question ? question.votes : 0);
  const [isLiked, setIsLiked] = useState(false);

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Không tìm thấy câu hỏi</Title>
        <Button type="primary" onClick={() => navigate('/')}>Quay lại trang chủ</Button>
      </div>
    );
  }

  const handleLike = () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để thực hiện hành động này!');
      return;
    }
    if (isLiked) {
      setVotes(prev => prev - 1);
      setIsLiked(false);
      message.success('Đã bỏ thích câu hỏi');
    } else {
      setVotes(prev => prev + 1);
      setIsLiked(true);
      message.success('Đã thích câu hỏi');
    }
  };

  const handlePostComment = () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để bình luận!');
      return;
    }
    if (!commentText.trim()) {
      message.warning('Vui lòng nhập nội dung bình luận!');
      return;
    }
    
    // Ở đây sẽ gọi API để lưu bình luận
    message.success('Đã đăng bình luận thành công!');
    setCommentText('');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/')} 
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>

      <Card bordered={false} className="question-card">
        <Row gutter={24}>
          <Col span={2} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Button 
                icon={isLiked ? <LikeFilled /> : <LikeOutlined />} 
                shape="circle" 
                size="large" 
                type={isLiked ? 'primary' : 'default'}
                onClick={handleLike}
              />
              <Text strong style={{ fontSize: 18 }}>{votes}</Text>
              <Text type="secondary">Votes</Text>
            </div>
          </Col>
          <Col span={22}>
            <Title level={2}>{question.title}</Title>
            <Space split={<Divider type="vertical" />} style={{ marginBottom: 20 }}>
              <Space><UserOutlined /> <Text strong>{question.author}</Text></Space>
              <Space><ClockCircleOutlined /> {question.time}</Space>
              <Space><MessageOutlined /> {question.answers} Trả lời</Space>
            </Space>

            <Paragraph style={{ fontSize: 16, lineHeight: '1.6', marginBottom: 24 }}>
              {question.description}
            </Paragraph>

            <div style={{ marginBottom: 30 }}>
              {question.tags.map(tag => (
                <Tag color="geekblue" key={tag} style={{ padding: '4px 12px', fontSize: 14 }}>#{tag}</Tag>
              ))}
            </div>

            <Divider orientation="left">Bình luận ({question.comments.length})</Divider>

            <List
              className="comment-list"
              itemLayout="horizontal"
              dataSource={question.comments}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />}
                    title={
                      <Space>
                        <Text strong>{item.author}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                      </Space>
                    }
                    description={item.content}
                  />
                </List.Item>
              )}
            />

            <div style={{ marginTop: 40, background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
              <Title level={4}>Thêm bình luận của bạn</Title>
              {user ? (
                <>
                  <TextArea 
                    rows={4} 
                    placeholder="Viết suy nghĩ của bạn..." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={handlePostComment}
                    size="large"
                  >
                    Gửi bình luận
                  </Button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Bạn cần </Text>
                  <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>đăng nhập</Button>
                  <Text type="secondary"> để bình luận.</Text>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default QuestionDetail;