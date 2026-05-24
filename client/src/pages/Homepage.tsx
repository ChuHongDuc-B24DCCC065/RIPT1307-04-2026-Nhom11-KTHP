import React, { useState, useEffect } from 'react';
import { List, Tag, Space, Button, Row, Col, Typography, Card, message, Empty, Skeleton, Input } from 'antd';
import { MessageOutlined, LikeOutlined, UserOutlined, ClockCircleOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

// --- Interface định nghĩa kiểu dữ liệu trả về từ API ---
interface Question {
  id: number;
  title: string;
  description: string;
  tags: string;           // DB trả về chuỗi "reactjs,nodejs"
  author: string;         // Từ LEFT JOIN users
  votes: number;
  answer_count: number;   // Từ subquery đếm answers
  created_at: string;
}

// --- Helper: Format thời gian tương đối ---
const formatTime = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff} giây trước`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // --- State ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Gọi API lấy danh sách câu hỏi ---
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions`);
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setQuestions(data);
    } catch (error) {
      console.error('Lỗi tải câu hỏi:', error);
      message.error('Không thể tải danh sách câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreateQuestion = () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đặt câu hỏi!');
      navigate('/login');
    } else {
      navigate('/create-question');
    }
  };

  // --- Filter questions based on search query ---
  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ==================== GRAND WELCOMING PANEL (MOCKUP ACCENT) ==================== */}
      <Card style={{ 
        background: '#ffffff', 
        borderRadius: '20px', 
        padding: '12px', 
        marginBottom: '32px', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)' 
      }}>
        <div style={{ padding: '16px' }}>
          <span style={{ 
            background: '#f3e8ff', 
            color: '#7c3aed', 
            padding: '5px 14px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: 600,
            border: '1px solid rgba(124, 58, 237, 0.15)',
            display: 'inline-block',
            marginBottom: '18px'
          }}>
            Thông tin hệ thống
          </span>
          <Title level={2} style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
            Chào mừng trở lại Diễn Đàn!
          </Title>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px 0', maxWidth: '820px' }}>
            Đây là khu vực hiển thị các thành phần dùng chung cho Diễn Đàn Công Nghệ. Bạn có thể thấy Header và Sidebar đã được tích hợp đầy đủ các chức năng yêu cầu.
          </p>

          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <Card 
                bordered={false} 
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #f1f5f9', 
                  borderRadius: '16px', 
                  height: '100%', 
                  boxShadow: '0 2px 8px -2px rgba(0,0,0,0.02)',
                  padding: '6px'
                }}
              >
                <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                  Chế độ Khách (Guest)
                </Title>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  Xem giao diện khi người dùng chưa đăng nhập.
                </p>
                <Space size="middle">
                  <Button 
                    onClick={() => navigate('/login')} 
                    style={{ 
                      borderRadius: '10px', 
                      fontWeight: 500, 
                      borderColor: '#cbd5e1', 
                      height: '38px',
                      padding: '0 18px'
                    }}
                  >
                    Đăng nhập
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/register')} 
                    style={{ 
                      borderRadius: '10px', 
                      fontWeight: 500,
                      height: '38px',
                      padding: '0 18px'
                    }}
                  >
                    Đăng ký
                  </Button>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card 
                bordered={false} 
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #f1f5f9', 
                  borderRadius: '16px', 
                  height: '100%', 
                  boxShadow: '0 2px 8px -2px rgba(0,0,0,0.02)',
                  padding: '6px'
                }}
              >
                <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                  Thanh công cụ câu hỏi
                </Title>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  Nút CTA nổi bật để khuyến khích thảo luận.
                </p>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleCreateQuestion} 
                  style={{ 
                    borderRadius: '10px', 
                    fontWeight: 600, 
                    background: '#6366f1', 
                    borderColor: '#6366f1',
                    height: '38px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Tạo câu hỏi mới
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      {/* ===== LOCAL SEARCH BOX ===== */}
      <div style={{ marginBottom: 28 }}>
        <Input
          size="large"
          placeholder="Lọc nhanh câu hỏi theo tiêu đề, nội dung hoặc thẻ ở đây..."
          prefix={<SearchOutlined style={{ color: '#94a3b8', marginRight: '6px' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            borderRadius: '14px', 
            height: '48px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            fontSize: '15px'
          }}
        />
      </div>

      {/* ===== DÒNG CÂU HỎI MỚI NHẤT ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
          Danh sách câu hỏi
          {!loading && (
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal', marginLeft: 10 }}>
              ({filteredQuestions.length} câu hỏi)
            </Text>
          )}
        </Title>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} style={{ marginBottom: 16, borderRadius: '16px' }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        ))
      ) : filteredQuestions.length === 0 ? (
        <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
          <Empty description={searchQuery ? "Không tìm thấy câu hỏi nào phù hợp!" : "Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!"} />
        </Card>
      ) : (
        <List
          itemLayout="vertical"
          size="large"
          dataSource={filteredQuestions}
          renderItem={(item) => {
            const tagList = item.tags
              ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
              : [];
            return (
              <Card
                className="premium-card transition-all"
                key={item.id}
                style={{ marginBottom: 18, cursor: 'pointer' }}
                onClick={() => navigate(`/questions/${item.id}`)}
              >
                <List.Item
                  style={{ padding: 0 }}
                  actions={[
                    <Space key="votes" style={{ color: '#4f46e5', fontWeight: 500 }}><LikeOutlined /> {item.votes ?? 0} Thích</Space>,
                    <Space key="answers" style={{ color: '#059669', fontWeight: 500 }}><MessageOutlined /> {item.answer_count ?? 0} Trả lời</Space>,
                    <Space key="time" style={{ color: '#64748b' }}><ClockCircleOutlined /> {item.created_at ? formatTime(item.created_at) : 'Vừa xong'}</Space>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <a
                        href={`/questions/${item.id}`}
                        style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', transition: 'color 0.2s ease' }}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/questions/${item.id}`);
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#1e293b')}
                      >
                        {item.title}
                      </a>
                    }
                    description={
                      <Space size="middle" style={{ marginTop: '4px' }}>
                        <Space size="small">
                          <UserOutlined style={{ color: '#94a3b8' }} />
                          <Text strong style={{ color: '#475569', fontSize: '13px' }}>{item.author || 'Ẩn danh'}</Text>
                        </Space>
                      </Space>
                    }
                  />
                  {/* Tóm tắt nội dung */}
                  <div style={{ margin: '14px 0', color: '#475569', fontSize: '14.5px', lineHeight: '1.6' }}>
                    {item.description && item.description.length > 150
                      ? `${item.description.replace(/<[^>]*>/g, '').substring(0, 150)}...`
                      : item.description.replace(/<[^>]*>/g, '')}
                  </div>
                  {/* Thẻ tags */}
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tagList.map(tag => (
                      <Tag 
                        color="purple" 
                        key={tag} 
                        style={{ 
                          cursor: 'pointer', 
                          borderRadius: '6px', 
                          padding: '3px 10px', 
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed',
                          border: 'none'
                        }}
                        onClick={() => navigate(`/search?tag=${tag}`)}
                      >
                        #{tag}
                      </Tag>
                    ))}
                  </div>
                </List.Item>
              </Card>
            );
          }}
        />
      )}
    </div>
  );
};

export default HomePage;