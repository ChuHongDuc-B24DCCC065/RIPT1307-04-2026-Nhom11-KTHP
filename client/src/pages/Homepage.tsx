import React, { useState, useEffect } from 'react';
import { Tag, Space, Button, Row, Col, Typography, Card, message, Empty, Skeleton, Input, Pagination, Tooltip, Radio, Avatar, Divider } from 'antd';
import { MessageOutlined, LikeOutlined, LikeFilled, UserOutlined, ClockCircleOutlined, SearchOutlined, PlusOutlined, FireOutlined, TrophyOutlined, NumberOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

// --- Interface định nghĩa kiểu dữ liệu ---
interface Question {
  id: number;
  title: string;
  description: string;
  tags: string;           
  author: string;         
  user_id: number;
  votes: number;
  answer_count?: number;   
  created_at: string;
  user_vote_type?: number;
  author_role?: string;
  is_announcement?: number;
  post_type?: string;
  deadline?: string;
  attachment_url?: string;
  attachment_name?: string;
}

interface HotQuestion {
  id: number;
  title: string;
  votes: number;
  answer_count: number;
}

interface Contributor {
  id: number;
  username: string;
  avatar?: string;
  reputation: number;
  role: string;
}

// --- MOCK DATA GIẢ CHO TRANG CHỦ ---
const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    title: "Lỗi 'Hydration failed' trong React 19 khi dùng Next.js, làm sao để fix?",
    description: "Chào mọi người, hiện tại mình đang nâng cấp dự án từ React 18 lên React 19 và gặp phải lỗi Hydration mismatch. Mình không rõ tại sao lỗi này lại xuất hiện vì ở version trước chạy rất bình thường.",
    tags: "ReactJS,Frontend,TypeScript,Web Performance",
    author: "Minh Phúc",
    user_id: 1,
    votes: 128,
    answer_count: 3,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() 
  },
  {
    id: 2,
    title: "Làm thế nào để tối ưu hóa truy vấn SQL chứa JOIN nhiều bảng lớn?",
    description: "Mình có một database MySQL chứa bảng users, orders, order_items với dữ liệu hàng triệu dòng. Hiện tại khi dùng JOIN 3 bảng này thì tốc độ query rất chậm, mất khoảng 5-8 giây. Nhờ mọi người hướng dẫn tối ưu.",
    tags: "Database,MySQL,Backend,Optimization",
    author: "Hoàng Anh",
    user_id: 2,
    votes: 85,
    answer_count: 5,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() 
  },
  {
    id: 3,
    title: "Hiểu sâu về cơ chế bất đồng bộ (Async/Await, Promise) trong JavaScript?",
    description: "Em mới học JS và gặp khó khăn khi phân biệt thứ tự thực thi giữa microtask và macrotask. Ví dụ sự khác nhau giữa setTimeout và Promise.resolve().then() là gì?",
    tags: "JavaScript,Beginner,Asynchronous",
    author: "Thanh Hằng",
    user_id: 3,
    votes: 42,
    answer_count: 0,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
  },
  {
    id: 4,
    title: "Tìm hiểu kiến trúc Microservices và cách phân chia các service hợp lý",
    description: "Công ty mình đang có kế hoạch chuyển từ kiến trúc Monolithic sang Microservices. Cho mình hỏi các tiêu chí quan trọng để phân chia một service là gì? Làm thế nào để giải quyết vấn đề distributed transaction?",
    tags: "Microservices,Architecture,Backend",
    author: "Quốc Trung",
    user_id: 4,
    votes: 95,
    answer_count: 2,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
  },
  {
    id: 5,
    title: "Sử dụng Tailwind CSS trong dự án lớn: Nên cấu hình thế nào để tối ưu hiệu suất?",
    description: "Tailwind CSS rất tiện lợi nhưng khi compile dự án lớn file CSS sinh ra khá nặng. Các bạn thường cấu hình plugin purge thế nào và quản lý các class trùng lặp ra sao?",
    tags: "Tailwind,CSS,Frontend,Optimization",
    author: "Linh Chi",
    user_id: 5,
    votes: 19,
    answer_count: 0,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() 
  }
];

const MOCK_HOT_QUESTIONS: HotQuestion[] = [
  { id: 1, title: "Lỗi 'Hydration failed' trong React 19 khi dùng Next.js, làm sao để fix?", votes: 128, answer_count: 3 },
  { id: 4, title: "Tìm hiểu kiến trúc Microservices và cách phân chia các service hợp lý", votes: 95, answer_count: 2 },
  { id: 2, title: "Làm thế nào để tối ưu hóa truy vấn SQL chứa JOIN nhiều bảng lớn?", votes: 85, answer_count: 5 },
  { id: 3, title: "Hiểu sâu về cơ chế bất đồng bộ (Async/Await, Promise) trong JavaScript?", votes: 42, answer_count: 0 },
  { id: 5, title: "Sử dụng Tailwind CSS trong dự án lớn: Nên cấu hình thế nào để tối ưu hiệu suất?", votes: 19, answer_count: 0 }
];

const MOCK_TOP_CONTRIBUTORS: Contributor[] = [
  { id: 2, username: "Hoàng Anh", reputation: 3120, role: "teacher" },
  { id: 1, username: "Minh Phúc", reputation: 2450, role: "student" },
  { id: 3, username: "Thanh Hằng", reputation: 1890, role: "student" }
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // --- State ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedQuestions, setLikedQuestions] = useState<Record<number, boolean>>({});
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [filterTab, setFilterTab] = useState<'newest' | 'votes' | 'unanswered'>('newest');

  // State quản lý phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // --- Gọi API lấy danh sách câu hỏi ---
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions?page=${currentPage}&limit=${pageSize}`,
        { headers }
      );
      
      const fetchedQuestions = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : (res.data?.data || []));
      setQuestions(fetchedQuestions);
      
      const total = res.data?.pagination?.total ?? (res.data?.total || fetchedQuestions.length);
      setTotalQuestions(Number(total));
      
      const initialLikes: Record<number, boolean> = {};
      fetchedQuestions.forEach((q: Question) => {
        if (q.user_vote_type === 1) {
          initialLikes[q.id] = true;
        }
      });
      setLikedQuestions(initialLikes);
    } catch (error) {
      console.error('Lỗi tải câu hỏi:', error);
      // Hiển thị mock data nếu API lỗi
      setQuestions(MOCK_QUESTIONS);
      setTotalQuestions(MOCK_QUESTIONS.length);
    } finally {
      setLoading(false);
    }
  };

  const fetchTagCounts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/tags/stats`
      );
      if (res.data?.success) {
        setTagCounts(res.data.data || {});
      }
    } catch (error) {
      console.error('Lỗi lấy thống kê tags:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchTagCounts();
  }, [currentPage, pageSize]);

  const handleCreateQuestion = () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đặt câu hỏi!');
      navigate('/login');
    } else {
      navigate('/create-question');
    }
  };

  const handleLike = async (e: React.MouseEvent, question: Question) => {
    e.stopPropagation(); 
    if (!user) {
      message.warning('Bạn cần đăng nhập để thích câu hỏi!');
      navigate('/login');
      return;
    }

    const isLiked = !!likedQuestions[question.id];
    
    // Cập nhật giao diện lập tức (Optimistic UI update)
    setLikedQuestions(prev => ({ ...prev, [question.id]: !isLiked }));
    setQuestions(prev => prev.map(q => 
      q.id === question.id 
        ? { ...q, votes: (q.votes || 0) + (isLiked ? -1 : 1) } 
        : q
    ));

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/${question.id}/vote`,
        { type: 'up' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Cập nhật lại state chuẩn xác từ backend trả về
      setLikedQuestions(prev => ({ ...prev, [question.id]: res.data.user_vote_type === 1 }));
      setQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { ...q, votes: res.data.votes } 
          : q
      ));
    } catch (error) {
      // Phục hồi lại trạng thái nếu gọi API lỗi
      setLikedQuestions(prev => ({ ...prev, [question.id]: isLiked }));
      setQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { ...q, votes: (q.votes || 0) + (isLiked ? 1 : -1) } 
          : q
      ));
      message.error('Lỗi khi thực hiện thao tác Thích!');
    }
  };

  const getFilteredAndSortedQuestions = () => {
    let result = [...questions];

    // Lọc nhanh bằng ô tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.toLowerCase().includes(q)
      );
    }

    // Lọc theo tabs bộ lọc
    if (filterTab === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filterTab === 'votes') {
      result.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (filterTab === 'unanswered') {
      result = result.filter(q => !q.answer_count || q.answer_count === 0);
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    const index = (name || 'A').charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const displayQuestions = getFilteredAndSortedQuestions();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 8px' }}>
      
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
          allowClear
        />
      </div>

      <Row gutter={[24, 24]}>
        {/* CỘT CHÍNH BÊN TRÁI (75%) */}
        <Col xs={24} lg={18}>
          
          {/* Header danh sách: Tiêu đề + Nút đặt câu hỏi */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <Title level={3} style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
              Danh sách câu hỏi
              {!loading && (
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal', marginLeft: 10 }}>
                  ({displayQuestions.length} câu hỏi)
                </Text>
              )}
            </Title>
            
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateQuestion}
              style={{
                borderRadius: '10px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                borderColor: '#6366f1',
                height: '40px',
                padding: '0 20px',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Đặt câu hỏi
            </Button>
          </div>

          {/* Bộ lọc nhanh: Tabs hoặc Radio.Group */}
          <div style={{ marginBottom: 20 }}>
            <Radio.Group 
              value={filterTab} 
              onChange={(e) => setFilterTab(e.target.value)} 
              optionType="button" 
              buttonStyle="solid"
              style={{ display: 'inline-flex', gap: 4 }}
            >
              <Radio.Button value="newest" style={{ borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 500 }}>
                Mới nhất
              </Radio.Button>
              <Radio.Button value="votes" style={{ borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 500 }}>
                Bình chọn nhiều
              </Radio.Button>
              <Radio.Button value="unanswered" style={{ borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 500 }}>
                Chưa trả lời
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} style={{ marginBottom: 16, borderRadius: '16px' }}>
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            ))
          ) : displayQuestions.length === 0 ? (
            <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
              <Empty description={searchQuery ? "Không tìm thấy câu hỏi nào phù hợp!" : "Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!"} />
            </Card>
          ) : (
            <>
              {displayQuestions.map((item) => {
                const tagList = item.tags
                  ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
                  : [];
                return (
                  <Card
                    className="premium-card animated-hover-card"
                    key={item.id}
                    style={{ marginBottom: 18, cursor: 'pointer', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}
                    onClick={() => navigate(`/questions/${item.id}`)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ marginBottom: 8 }}>
                        <a
                          href={`/questions/${item.id}`}
                          style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', display: 'block', transition: 'color 0.2s ease' }}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/questions/${item.id}`);
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#1e293b')}
                        >
                          {item.title}
                        </a>
                        <Space size="middle" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
                          <Space size="small">
                            <UserOutlined style={{ color: '#94a3b8' }} />
                            <Text strong style={{ color: '#475569', fontSize: '13px' }}>{item.author || 'Ẩn danh'}</Text>
                            {item.author_role === 'teacher' && (
                              <Tag color="blue" style={{ borderRadius: 5, fontWeight: 600, fontSize: 10, padding: '0 6px', margin: 0 }}>👨‍🏫 GV</Tag>
                            )}
                          </Space>
                          {(item.is_announcement === 1 || item.post_type === 'announcement') && (
                            <Tag color="gold" style={{ borderRadius: 5, fontWeight: 600, fontSize: 10, padding: '0 6px', margin: 0 }}>📢 Thông báo</Tag>
                          )}
                          {item.post_type === 'assignment' && (
                            <Tag color="volcano" style={{ borderRadius: 5, fontWeight: 600, fontSize: 10, padding: '0 6px', margin: 0 }}>
                              📝 Bài tập {item.deadline ? `(Hạn nộp: ${dayjs(item.deadline).format('DD/MM HH:mm')})` : ''}
                            </Tag>
                          )}
                          {item.post_type === 'material' && (
                            <Tag color="cyan" style={{ borderRadius: 5, fontWeight: 600, fontSize: 10, padding: '0 6px', margin: 0 }}>📚 Tài liệu học tập</Tag>
                          )}
                        </Space>
                      </div>
                      {/* Tóm tắt nội dung */}
                      <div style={{ margin: '14px 0', color: '#475569', fontSize: '14.5px', lineHeight: '1.6' }}>
                        {item.description && item.description.length > 150
                          ? `${item.description.replace(/<[^>]*>/g, '').substring(0, 150)}...`
                          : item.description.replace(/<[^>]*>/g, '')}
                      </div>
                      {/* Thẻ tags */}
                      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 16 }}>
                        {tagList.map(tag => {
                          const count = tagCounts[tag.toLowerCase()] || 0;
                          return (
                            <Tooltip key={tag} title={`Có ${count} câu hỏi gắn thẻ này`}>
                              <Tag 
                                color="purple" 
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
                                onClick={() => navigate(`/search?tag=${tag.toLowerCase()}`)}
                              >
                                #{tag}
                              </Tag>
                            </Tooltip>
                          );
                        })}
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <Space size="large" style={{ color: '#8c8c8c' }}>
                        <Space 
                          key="votes" 
                          onClick={(e) => handleLike(e, item)}
                          style={{ 
                            color: likedQuestions[item.id] ? '#1890ff' : '#4f46e5', 
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: likedQuestions[item.id] ? '#e6f7ff' : 'transparent',
                            transition: 'all 0.3s'
                          }}
                        >
                          {likedQuestions[item.id] ? <LikeFilled /> : <LikeOutlined />} {item.votes ?? 0} Thích
                        </Space>
                        <Space key="answers" style={{ color: '#059669', fontWeight: 500 }}><MessageOutlined /> {item.answer_count ?? 0} Trả lời</Space>
                        <Space key="time" style={{ color: '#64748b' }}><ClockCircleOutlined /> {item.created_at ? dayjs(item.created_at).fromNow() : 'Vừa xong'}</Space>
                      </Space>
                    </div>
                  </Card>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px', marginBottom: '20px' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalQuestions}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  showSizeChanger
                  pageSizeOptions={['5', '10', '20', '50']}
                  style={{
                    background: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                />
              </div>
            </>
          )}
        </Col>

        {/* CỘT PHỤ BÊN PHẢI (25% - Sidebar) */}
        <Col xs={24} lg={6}>
          {/* Card 1: Câu hỏi nổi bật trong tuần */}
          <Card 
            title={<Space><FireOutlined style={{ color: '#ef4444' }} /><strong>Nổi bật trong tuần</strong></Space>}
            variant="borderless"
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)', 
              marginBottom: 24,
              border: '1px solid #e2e8f0'
            }}
            styles={{ body: { padding: '16px' } }}
          >
            {MOCK_HOT_QUESTIONS.map((item) => (
              <div 
                key={item.id}
                style={{ 
                  padding: '10px 0', 
                  borderBottom: '1px dashed #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <a
                  href={`/questions/${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/questions/${item.id}`);
                  }}
                  style={{ 
                    fontSize: '13.5px', 
                    fontWeight: 600, 
                    color: '#334155',
                    lineHeight: '1.4',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
                >
                  {item.title}
                </a>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: '#94a3b8' }}>
                  <Space size={2}><LikeOutlined /> {item.votes} lượt thích</Space>
                  <Space size={2}><MessageOutlined /> {item.answer_count} phản hồi</Space>
                </div>
              </div>
            ))}
          </Card>

          {/* Card 2: Bảng xếp hạng đóng góp */}
          <Card 
            title={<Space><TrophyOutlined style={{ color: '#f59e0b' }} /><strong>Top đóng góp</strong></Space>}
            variant="borderless"
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
              border: '1px solid #e2e8f0'
            }}
            styles={{ body: { padding: '16px' } }}
          >
            {MOCK_TOP_CONTRIBUTORS.map((item, index) => (
              <div 
                key={item.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: index < 2 ? '1px dashed #f1f5f9' : 'none'
                }}
              >
                <Space size="middle">
                  <Avatar 
                    style={{ 
                      background: getAvatarGradient(item.username),
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  >
                    {item.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {item.username}
                      {item.role === 'teacher' && (
                        <span style={{ fontSize: '10px' }} title="Giảng viên">👨‍🏫</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {item.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}
                    </div>
                  </div>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1' }}>
                    {item.reputation}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Uy tín
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;