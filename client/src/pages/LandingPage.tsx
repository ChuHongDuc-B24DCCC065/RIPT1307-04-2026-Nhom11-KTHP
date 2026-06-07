import React, { useEffect } from 'react';
import { Button, Typography, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  RocketOutlined, 
  TeamOutlined, 
  QuestionCircleOutlined, 
  ArrowRightOutlined, 
  ThunderboltFilled, 
  CheckCircleFilled, 
  MessageOutlined, 
  LikeOutlined, 
  StarOutlined 
} from '@ant-design/icons';
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
      {/* Dynamic Glowing Blobs for Backdrop Depth */}
      <div className="landing-bg-glow-1"></div>
      <div className="landing-bg-glow-2"></div>
      <div className="landing-bg-glow-3"></div>
      <div className="landing-grid-overlay"></div>

      <div className="landing-content">
        {/* HERO SECTION */}
        <Row gutter={[48, 48]} align="middle" className="hero-row">
          {/* Left Column: Title and CTA */}
          <Col xs={24} lg={12} className="hero-left-col">
            <div className="landing-badge">
              <span className="badge-glow"></span>
              <ThunderboltFilled className="badge-icon" /> 
              Nền tảng học tập & trao đổi số 1 cho sinh viên
            </div>
            
            <Title className="landing-title">
              Kết nối tri thức <br />
              <span className="gradient-text">Kiến tạo tương lai</span>
            </Title>
            
            <Paragraph className="landing-subtitle">
              Nơi giao lưu, giải đáp thắc mắc và chia sẻ tài liệu học tập chuẩn chỉnh dành riêng cho cộng đồng sinh viên công nghệ.
            </Paragraph>
            
            <div className="landing-actions">
              <Button 
                type="primary" 
                size="large" 
                onClick={() => navigate('/login')} 
                className="landing-btn-primary"
              >
                Đăng nhập ngay <ArrowRightOutlined className="btn-arrow" />
              </Button>
              <Button 
                size="large" 
                onClick={() => navigate('/')} 
                className="landing-btn-secondary"
              >
                Khám phá câu hỏi
              </Button>
            </div>

            <div className="landing-hero-tags">
              <span className="hero-tag">
                <CheckCircleFilled className="tag-check" /> Giải đáp nhanh
              </span>
              <span className="hero-tag">
                <CheckCircleFilled className="tag-check" /> 5,000+ Thành viên
              </span>
              <span className="hero-tag">
                <CheckCircleFilled className="tag-check" /> Tài liệu chọn lọc
              </span>
            </div>
          </Col>

          {/* Right Column: Animated Mock Q&A UI */}
          <Col xs={24} lg={12} className="hero-right-col">
            <div className="mock-ui-container">
              <div className="mock-ui-window">
                {/* Window Header */}
                <div className="window-header">
                  <div className="window-buttons">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yellow"></span>
                    <span className="dot dot-green"></span>
                  </div>
                  <div className="window-title">localhost:5173/qa-forum</div>
                </div>

                {/* Window Content */}
                <div className="window-body">
                  {/* Mock Question */}
                  <div className="mock-post question-post animate-fade-in-up">
                    <div className="post-header">
                      <div className="mock-avatar avatar-student">SV</div>
                      <div className="post-user-info">
                        <div className="user-name">Nguyễn Văn An</div>
                        <div className="user-meta">Sinh viên năm 2 • CNTT</div>
                      </div>
                      <span className="post-badge badge-q">Hỏi</span>
                    </div>
                    <div className="post-content">
                      <p className="post-text">
                        Mọi người ơi, làm sao để phân biệt sự khác nhau giữa <strong>State</strong> và <strong>Props</strong> trong ReactJs vậy ạ? Khi nào thì nên dùng cái nào? 🤔
                      </p>
                      <div className="post-tags">
                        <span className="mock-tag">#reactjs</span>
                        <span className="mock-tag">#frontend</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock Reply */}
                  <div className="mock-post reply-post animate-fade-in-up-delay-1">
                    <div className="post-header">
                      <div className="mock-avatar avatar-teacher">GV</div>
                      <div className="post-user-info">
                        <div className="user-name">Thầy Trần Hoàng Nam</div>
                        <div className="user-meta">Giảng viên Khoa CNTT</div>
                      </div>
                      <span className="post-badge badge-a">Giải đáp</span>
                    </div>
                    <div className="post-content">
                      <p className="post-text">
                        Chào An, em hiểu đơn giản nhé:
                      </p>
                      <ul>
                        <li><strong>State:</strong> Là dữ liệu nội bộ của component, có thể thay đổi được (mutated).</li>
                        <li><strong>Props:</strong> Dữ liệu truyền từ component cha xuống, chỉ đọc (read-only).</li>
                      </ul>
                      <div className="mock-code-snippet">
                        <pre>
{`// Props: Nhận vào từ bên ngoài
const Welcome = (props) => <h1>Hello, {props.name}</h1>;`}
                        </pre>
                      </div>
                      <div className="reply-actions">
                        <span><LikeOutlined /> 15 Thích</span>
                        <span><MessageOutlined /> 3 Phản hồi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements for visual decoration */}
              <div className="floating-bubble bubble-1">
                <StarOutlined style={{ color: '#fbbf24', marginRight: 4 }} /> +250 Điểm đóng góp
              </div>
              <div className="floating-bubble bubble-2">
                <RocketOutlined style={{ color: '#8b5cf6', marginRight: 4 }} /> Đạt huy hiệu "Chăm Chỉ"
              </div>
            </div>
          </Col>
        </Row>

        {/* STATISTICS SECTION */}
        <div className="stats-section">
          <Row gutter={[24, 24]}>
            <Col xs={12} md={6}>
              <div className="stat-card">
                <div className="stat-value text-indigo">10K+</div>
                <div className="stat-label">Câu hỏi giải đáp</div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="stat-card">
                <div className="stat-value text-purple">5,000+</div>
                <div className="stat-label">Sinh viên tham gia</div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="stat-card">
                <div className="stat-value text-emerald">98%</div>
                <div className="stat-label">Tỉ lệ giải đáp nhanh</div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="stat-card">
                <div className="stat-value text-orange">500+</div>
                <div className="stat-label">Tài liệu chia sẻ</div>
              </div>
            </Col>
          </Row>
        </div>

        {/* CORE FEATURES SECTION */}
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Tính Năng Nổi Bật</h2>
            <p className="section-subtitle">Hệ sinh thái hỗ trợ học tập toàn diện cho sinh viên</p>
          </div>

          <Row gutter={[32, 32]} className="feature-cards-row-new">
            <Col xs={24} md={8}>
              <Card className="feature-card-new qna-card-new" variant="borderless">
                <div className="feature-icon-wrapper-new">
                  <QuestionCircleOutlined className="feature-icon-new" />
                </div>
                <Title level={4} className="feature-title-new">Hỏi & Đáp Học Thuật</Title>
                <Paragraph className="feature-description-new">
                  Đặt câu hỏi dễ dàng và nhận câu trả lời nhanh chóng từ cộng đồng và giảng viên có chuyên môn.
                </Paragraph>
                <ul className="feature-list">
                  <li><CheckCircleFilled className="list-icon" /> Đặt câu hỏi ẩn danh bảo mật</li>
                  <li><CheckCircleFilled className="list-icon" /> Hỗ trợ chèn code block thông minh</li>
                  <li><CheckCircleFilled className="list-icon" /> Tích hợp trợ lý AI giải đáp 24/7</li>
                </ul>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card className="feature-card-new community-card-new" variant="borderless">
                <div className="feature-icon-wrapper-new">
                  <TeamOutlined className="feature-icon-new" />
                </div>
                <Title level={4} className="feature-title-new">Cộng Đồng Năng Động</Title>
                <Paragraph className="feature-description-new">
                  Kết nối, giao lưu học hỏi với hàng ngàn sinh viên từ các khóa học và các khoa chuyên ngành khác nhau.
                </Paragraph>
                <ul className="feature-list">
                  <li><CheckCircleFilled className="list-icon" /> Phân chia phòng thảo luận theo khoa</li>
                  <li><CheckCircleFilled className="list-icon" /> Hệ thống điểm và danh hiệu đóng góp</li>
                  <li><CheckCircleFilled className="list-icon" /> Theo dõi và kết bạn dễ dàng</li>
                </ul>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card className="feature-card-new study-card-new" variant="borderless">
                <div className="feature-icon-wrapper-new">
                  <RocketOutlined className="feature-icon-new" />
                </div>
                <Title level={4} className="feature-title-new">Tài Nguyên Học Tập</Title>
                <Paragraph className="feature-description-new">
                  Kho tàng đề thi thử, tài liệu ôn tập và lộ trình học IT chất lượng cao giúp bạn bứt phá học lực.
                </Paragraph>
                <ul className="feature-list">
                  <li><CheckCircleFilled className="list-icon" /> Download đề thi thử có lời giải</li>
                  <li><CheckCircleFilled className="list-icon" /> Lộ trình tự học Frontend/Backend</li>
                  <li><CheckCircleFilled className="list-icon" /> Đánh dấu lưu trữ bài viết hữu ích</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </div>

        {/* CTA BANNER */}
        <div className="landing-cta-banner">
          <div className="cta-banner-glow"></div>
          <div className="cta-content">
            <h2 className="cta-title">Sẵn sàng nâng cao hiệu quả học tập?</h2>
            <p className="cta-subtitle">
              Đăng ký tài khoản ngay hôm nay để nhận giải đáp từ thầy cô và kết nối với các sinh viên tài năng khác.
            </p>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate('/register')} 
              className="cta-btn"
            >
              Đăng ký miễn phí ngay <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;