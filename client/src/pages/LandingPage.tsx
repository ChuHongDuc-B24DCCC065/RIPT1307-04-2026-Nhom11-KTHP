import React, { useEffect } from 'react';
import { Button, Typography, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RocketOutlined, TeamOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import './LandingPage.css';

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
    <div className="landing-page-container">
      {/* Decorative background visual elements */}
      <div className="landing-bg-glow-1"></div>
      <div className="landing-bg-glow-2"></div>
      <div className="landing-grid-overlay"></div>

      <div className="landing-content">
        <Row justify="center">
          <Col xs={24} md={18} lg={16}>
            <Title className="landing-title">Chào mừng đến với Diễn đàn hỏi đáp sinh viên</Title>
            <Paragraph className="landing-subtitle">
              Nơi kết nối tri thức, giải đáp mọi thắc mắc và chia sẻ kinh nghiệm học tập 
              dành riêng cho cộng đồng sinh viên.
            </Paragraph>
            <div style={{ marginTop: '30px' }}>
              <Button 
                type="primary" 
                size="large" 
                onClick={() => navigate('/login')} 
                className="landing-btn-primary"
              >
                Đăng nhập ngay
              </Button>
              <Button 
                size="large" 
                onClick={() => navigate('/')} 
                className="landing-btn-secondary"
              >
                Xem danh sách câu hỏi
              </Button>
            </div>
          </Col>
        </Row>

        <Row gutter={[32, 32]} className="feature-cards-row">
          <Col xs={24} sm={12} md={8}>
            <Card className="feature-card qna-card" variant="borderless">
              <div className="feature-icon-wrapper">
                <QuestionCircleOutlined className="feature-icon" />
              </div>
              <Title level={4} className="feature-title">Hỏi & Đáp</Title>
              <Paragraph className="feature-description">
                Đặt câu hỏi và nhận câu trả lời từ những người có kinh nghiệm.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="feature-card community-card" variant="borderless">
              <div className="feature-icon-wrapper">
                <TeamOutlined className="feature-icon" />
              </div>
              <Title level={4} className="feature-title">Cộng đồng</Title>
              <Paragraph className="feature-description">
                Giao lưu với sinh viên từ khắp các khoa và khóa học.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card className="feature-card study-card" variant="borderless">
              <div className="feature-icon-wrapper">
                <RocketOutlined className="feature-icon" />
              </div>
              <Title level={4} className="feature-title">Học tập</Title>
              <Paragraph className="feature-description">
                Tài liệu, mẹo ôn thi và lộ trình học IT cực chất.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default LandingPage;