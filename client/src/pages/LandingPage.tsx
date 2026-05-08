import React, { useEffect } from 'react';
import { Button, Typography, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RocketOutlined, TeamOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff' }}>
      <Row justify="center">
        <Col span={16}>
          <Title style={{ fontSize: '48px' }}>Chào mừng đến với SV-FORUM</Title>
          <Paragraph style={{ fontSize: '18px', color: '#666' }}>
            Nơi kết nối tri thức, giải đáp mọi thắc mắc và chia sẻ kinh nghiệm học tập 
            dành riêng cho cộng đồng sinh viên.
          </Paragraph>
          <div style={{ marginTop: '30px' }}>
            <Button type="primary" size="large" onClick={() => navigate('/login')} style={{ marginRight: '15px' }}>
              Đăng nhập ngay
            </Button>
            <Button size="large" onClick={() => navigate('/')}>
              Xem danh sách câu hỏi
            </Button>
          </div>
        </Col>
      </Row>

      <Row gutter={32} style={{ marginTop: '80px' }}>
        <Col span={8}>
          <Card bordered={false}>
            <QuestionCircleOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
            <Title level={4}>Hỏi & Đáp</Title>
            <p>Đặt câu hỏi và nhận câu trả lời từ những người có kinh nghiệm.</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <TeamOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
            <Title level={4}>Cộng đồng</Title>
            <p>Giao lưu với sinh viên từ khắp các khoa và khóa học.</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <RocketOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
            <Title level={4}>Học tập</Title>
            <p>Tài liệu, mẹo ôn thi và lộ trình học IT cực chất.</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LandingPage;