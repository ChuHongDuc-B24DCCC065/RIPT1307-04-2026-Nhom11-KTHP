import React, { useState, useEffect } from 'react';
import { List, Tag, Space, Button, Row, Col, Typography, Card, message, Empty, Skeleton, Input, Pagination } from 'antd';
import { MessageOutlined, LikeOutlined, UserOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
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

  // --- States Phân Trang ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  // --- Gọi API lấy danh sách câu hỏi với phân trang ---
  const fetchQuestions = async (page: number, limit: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions`, {
        params: { page, limit }
      });
      // Hỗ trợ cả 2 kiểu response: mảng trực tiếp hoặc đối tượng { data: [...], total: số_lượng }
      const data = res.data?.data || [];
      const total = res.data?.pagination?.total ?? res.data?.total ?? (Array.isArray(res.data) ? res.data.length : data.length);
      setQuestions(data);
      setTotalQuestions(total);
    } catch (error) {
      console.error('Lỗi tải câu hỏi:', error);
      message.error('Không thể tải danh sách câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

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

  // --- Popular tags list ---
  const popularTags = ['reactjs', 'nodejs', 'mysql', 'typescript', 'javascript', 'python'];

  return (
    <>
      {/* ===== Search Bar ===== */}
      <div style={{ marginBottom: 24 }}>
        <Input
          size="large"
          placeholder="Tìm kiếm câu hỏi theo tiêu đề, nội dung hoặc thẻ..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ borderRadius: 4 }}
        />
      </div>

      <Row gutter={24}>
        {/* ===== Cột trái: Danh sách câu hỏi ===== */}
        <Col span={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Title level={2} style={{ margin: 0 }}>
              Câu hỏi mới nhất
              {!loading && (
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal', marginLeft: 10 }}>
                  ({totalQuestions} câu hỏi)
                </Text>
              )}
            </Title>
            <Button type="primary" size="large" onClick={handleCreateQuestion}>
              Đặt câu hỏi
            </Button>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} style={{ marginBottom: 16 }}>
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            ))
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <Empty description={searchQuery ? "Không tìm thấy câu hỏi nào phù hợp!" : "Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!"} />
            </Card>
          ) : (
            <>
              <List
                itemLayout="vertical"
                size="large"
                dataSource={filteredQuestions}
                renderItem={(item) => {
                  // Parse tags: "reactjs,nodejs" → ['reactjs', 'nodejs']
                  const tagList = item.tags
                    ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
                    : [];
                  return (
                    <Card
                      hoverable
                      key={item.id}
                      style={{ marginBottom: 16 }}
                      onClick={() => navigate(`/questions/${item.id}`)}
                    >
                      <List.Item
                        actions={[
                          <Space key="votes"><LikeOutlined /> {item.votes ?? 0} Votes</Space>,
                          <Space key="answers"><MessageOutlined /> {item.answer_count ?? 0} Trả lời</Space>,
                          <Space key="time"><ClockCircleOutlined /> {item.created_at ? formatTime(item.created_at) : 'Vừa xong'}</Space>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <a
                              href={`/questions/${item.id}`}
                              style={{ fontSize: 18, fontWeight: 600 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.title}
                            </a>
                          }
                          description={
                            <Space>
                              <UserOutlined />
                              <Text type="secondary">{item.author || 'Ẩn danh'}</Text>
                            </Space>
                          }
                        />
                        {/* Nội dung tóm tắt */}
                        <div style={{ marginBottom: 12, color: '#555' }}>
                          {item.description && item.description.length > 150
                            ? `${item.description.substring(0, 150)}...`
                            : item.description}
                        </div>
                        {/* Tags */}
                        <div onClick={(e) => e.stopPropagation()}>
                          {tagList.map(tag => (
                            <Tag 
                              color="geekblue" 
                              key={tag} 
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSearchQuery(tag)}
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
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 16 }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalQuestions}
                  onChange={handlePageChange}
                  showSizeChanger
                  pageSizeOptions={['5', '10', '20']}
                />
              </div>
            </>
          )}
        </Col>

        {/* ===== Cột phải: Sidebar ===== */}
        <Col span={6}>
          {/* Card thông tin user */}
          {user ? (
            <Card style={{ marginBottom: 20, textAlign: 'center', border: '1px solid #1890ff' }}>
              <UserOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 10 }} />
              <Title level={4}>Chào, {user.username}!</Title>
              <Text type="secondary">
                Vai trò: <Tag color="blue">{user.role}</Tag>
              </Text>
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
              <Button type="primary" block onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            </Card>
          )}

          {/* Popular Tags Section */}
          <Card title="Thẻ phổ biến" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {popularTags.map(tag => (
                <div
                  key={tag}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e8e8e8',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#e6f7ff';
                    (e.currentTarget as HTMLElement).style.borderColor = '#1890ff';
                    (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
                    (e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8';
                    (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                  }}
                  onClick={() => setSearchQuery(tag)}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1890ff' }}>#{tag}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats Card */}
          <Card title="Thống kê" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <Text type="secondary">Tổng câu hỏi</Text>
                <Title level={4} style={{ margin: '8px 0 0 0' }}>
                  {totalQuestions}
                </Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default HomePage;