import React, { useState, useEffect } from 'react';
import { Tag, Space, Button, Row, Col, Typography, Card, message, Empty, Skeleton, Input, Pagination, Tooltip, Radio, Avatar, Divider, Popover, List } from 'antd';
import { MessageOutlined, LikeOutlined, LikeFilled, UserOutlined, ClockCircleOutlined, SearchOutlined, PlusOutlined, FireOutlined, TrophyOutlined, NumberOutlined, CheckOutlined, StarFilled, SyncOutlined, EyeOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';
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
  is_interesting?: number;
  views?: number;
  author_reputation?: number;
}

interface Activity {
  id: string;
  type: 'answer' | 'verify' | 'view';
  content: string;
  questionTitle: string;
  questionId: number;
  created_at: string;
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
  const [filterTab, setFilterTab] = useState<'newest' | 'votes' | 'unanswered' | 'interesting'>('newest');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // State quản lý phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // --- Gọi API lấy danh sách câu hỏi ---
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let res;
      if (filterTab === 'interesting') {
        res = await axiosInstance.get('/questions/interesting');
      } else {
        res = await axiosInstance.get(`/questions?page=${currentPage}&limit=${pageSize}`);
      }
      
      const fetchedQuestions = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : (res.data?.data || []));
      setQuestions(fetchedQuestions);
      
      const total = filterTab === 'interesting'
        ? fetchedQuestions.length
        : (res.data?.pagination?.total ?? (res.data?.total || fetchedQuestions.length));
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
      if (filterTab !== 'interesting') {
        setQuestions(MOCK_QUESTIONS);
        setTotalQuestions(MOCK_QUESTIONS.length);
      } else {
        setQuestions([]);
        setTotalQuestions(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Gọi API lấy danh sách hoạt động cộng đồng ---
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const res = await axiosInstance.get('/community/activities');
      if (res.data?.success) {
        setActivities(res.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải hoạt động cộng đồng:', error);
      // Mock data fallback if API fails
      setActivities([
        { id: 'act-1', type: 'answer', content: 'Sinh viên Minh Phúc vừa trả lời câu hỏi', questionTitle: 'Lỗi Hydration failed trong React 19 khi dùng Next.js', questionId: 1, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
        { id: 'act-2', type: 'verify', content: 'Giảng viên Hoàng Anh vừa ghim một đáp án đúng cho câu hỏi', questionTitle: 'Làm thế nào để tối ưu hóa truy vấn SQL chứa JOIN nhiều bảng lớn?', questionId: 2, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
        { id: 'act-3', type: 'view', content: 'vừa đạt mốc 100 lượt xem', questionTitle: 'Hiểu sâu về cơ chế bất đồng bộ (Async/Await, Promise) trong JavaScript?', questionId: 3, created_at: new Date(Date.now() - 120 * 60000).toISOString() }
      ]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const [tagsData, setTagsData] = useState<Record<string, { description: string; count: number }>>({});
  const [watchedTags, setWatchedTags] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('watchedTags') || '[]');
    } catch {
      return [];
    }
  });

  const toggleWatchTag = (tagName: string) => {
    const isWatched = watchedTags.includes(tagName.toLowerCase());
    let updated;
    if (isWatched) {
      updated = watchedTags.filter(t => t !== tagName.toLowerCase());
      message.success(`Đã bỏ theo dõi thẻ #${tagName}`);
    } else {
      updated = [...watchedTags, tagName.toLowerCase()];
      message.success(`Đã theo dõi thẻ #${tagName}`);
    }
    setWatchedTags(updated);
    localStorage.setItem('watchedTags', JSON.stringify(updated));
  };

  const fetchTagCounts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/tags/stats`
      );
      if (res.data?.success) {
        setTagCounts(res.data.data || {});
      }

      const resList = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/tags/list`
      );
      if (resList.data?.success) {
        const data: Record<string, { description: string; count: number }> = {};
        resList.data.data.forEach((t: any) => {
          data[t.name.toLowerCase()] = {
            description: t.description,
            count: t.question_count
          };
        });
        setTagsData(data);
      }
    } catch (error) {
      console.error('Lỗi lấy thống kê tags:', error);
    }
  };

  const getTagInfo = (tagName: string) => {
    const key = tagName.toLowerCase();
    const info = tagsData[key];
    return {
      description: info?.description || 'Không có mô tả cho thẻ này.',
      count: info?.count || tagCounts[key] || 0
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
  };

  useEffect(() => {
    fetchTagCounts();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchQuestions();
    }
  }, [filterTab]);

  useEffect(() => {
    fetchQuestions();
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
              onChange={(e) => {
                if (e.target.value === 'interesting' && !user) {
                  message.warning('Bạn cần đăng nhập để xem những bài viết gợi ý dành riêng cho bạn!');
                  navigate('/login');
                  return;
                }
                setFilterTab(e.target.value);
              }}
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
              <Radio.Button value="interesting" style={{ borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 500, color: '#f59e0b' }}>
                <StarFilled style={{ marginRight: '4px', color: '#f59e0b' }} />Dành cho bạn
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
              <div className="so-questions-list-container">
                {displayQuestions.map((item) => {
                  const tagList = item.tags
                    ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
                    : [];
                  return (
                    <div className="so-question-item" key={item.id}>
                      {/* Left: Stats Column */}
                      <div className="so-stats-container">
                        <div 
                          className={`so-stat-item votes ${likedQuestions[item.id] ? 'vote-btn-active' : ''}`}
                          onClick={(e) => handleLike(e, item)}
                          style={{ 
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: likedQuestions[item.id] ? '#e6f7ff' : 'transparent',
                            color: likedQuestions[item.id] ? '#1890ff' : '#334155',
                            transition: 'all 0.2s'
                          }}
                          title="Bấm để Thích/Bỏ Thích"
                        >
                          {formatNumber(item.votes ?? 0)} votes
                        </div>
                        
                        <div className={`so-stat-item answers ${item.answer_count && item.answer_count > 0 ? 'has-accepted' : ''}`}>
                          {item.answer_count && item.answer_count > 0 && <CheckOutlined style={{ marginRight: '4px' }} />}
                          {formatNumber(item.answer_count ?? 0)} answers
                        </div>
                        
                        <div className="so-stat-item views">
                          {formatNumber(item.views ?? 0)} views
                        </div>
                      </div>

                      {/* Right: Content Column */}
                      <div className="so-content-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {item.is_interesting === 1 && (
                            <Tooltip title="Bài viết gợi ý dựa trên sở thích của bạn">
                              <StarFilled style={{ color: '#f59e0b', fontSize: '15px', marginRight: '4px' }} />
                            </Tooltip>
                          )}
                          <a
                            href={`/questions/${item.id}`}
                            className="so-question-title"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/questions/${item.id}`);
                            }}
                            style={{ marginBottom: 0 }}
                          >
                            {item.title}
                          </a>
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
                        </div>

                        <div className="so-question-excerpt">
                          {item.description && item.description.length > 180
                            ? `${item.description.replace(/<[^>]*>/g, '').substring(0, 180)}...`
                            : item.description.replace(/<[^>]*>/g, '')}
                        </div>

                        <div className="so-meta-row">
                          <div className="so-tags-list" onClick={(e) => e.stopPropagation()}>
                            {tagList.map(tag => {
                              const info = getTagInfo(tag);
                              const isWatched = watchedTags.includes(tag.toLowerCase());
                              return (
                                <Popover
                                  key={tag}
                                  trigger="hover"
                                  placement="top"
                                  content={
                                    <div style={{ width: 280, padding: '4px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div>
                                          <div className="so-popover-tag-title">{tag.toLowerCase()}</div>
                                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: 2 }}>
                                            <strong>{formatNumber(info.count)}</strong> questions
                                          </div>
                                        </div>
                                        <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, minHeight: '36px' }}>
                                          {info.description}
                                        </div>
                                        <Button 
                                          type={isWatched ? "default" : "primary"} 
                                          size="middle" 
                                          block
                                          style={{ 
                                            borderRadius: 8, 
                                            fontWeight: 600,
                                            height: '38px',
                                            boxShadow: isWatched ? 'none' : '0 2px 4px rgba(22, 119, 255, 0.2)'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWatchTag(tag);
                                          }}
                                        >
                                          {isWatched ? 'Đang theo dõi' : 'Watch tag'}
                                        </Button>
                                      </div>
                                    </div>
                                  }
                                >
                                  <Tag 
                                    className="so-tag"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/search?tag=${tag.toLowerCase()}`);
                                    }}
                                  >
                                    {tag.toLowerCase()}
                                  </Tag>
                                </Popover>
                              );
                            })}
                          </div>

                          <div className="so-user-box" onClick={(e) => e.stopPropagation()}>
                            <Avatar 
                              size={18} 
                              style={{ 
                                background: getAvatarGradient(item.author),
                                fontWeight: 600,
                                fontSize: '9px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {(item.author || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <span 
                              className="so-username"
                              onClick={() => navigate(`/profile?id=${item.user_id}`)}
                            >
                              {item.author || 'Ẩn danh'}
                            </span>
                            {item.author_role === 'teacher' && (
                              <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginRight: '2px' }}>👨‍🏫 GV</span>
                            )}
                            <span className="so-reputation" title="Điểm uy tín">
                              {item.author_reputation ?? 100}
                            </span>
                            <span className="so-time">
                              hỏi {item.created_at ? dayjs(item.created_at).fromNow() : 'vừa xong'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

          {/* Card: Hoạt động cộng đồng */}
          <Card 
            title={<Space><SyncOutlined style={{ color: '#6366f1' }} /><strong>Hoạt động cộng đồng</strong></Space>}
            extra={
              <Tooltip title="Làm mới hoạt động">
                <SyncOutlined 
                  spin={activitiesLoading} 
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchActivities();
                  }} 
                  style={{ cursor: 'pointer', color: '#6366f1' }} 
                />
              </Tooltip>
            }
            variant="borderless"
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)', 
              marginBottom: 24,
              border: '1px solid #e2e8f0'
            }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <List
              loading={activitiesLoading}
              dataSource={activities}
              renderItem={(item) => {
                let icon = <MessageOutlined style={{ color: '#3b82f6' }} />;
                if (item.type === 'verify') {
                  icon = <CheckCircleFilled style={{ color: '#10b981' }} />;
                } else if (item.type === 'view') {
                  icon = <EyeOutlined style={{ color: '#f59e0b' }} />;
                }

                return (
                  <List.Item 
                    style={{ 
                      padding: '12px 0', 
                      borderBottom: '1px dashed #f1f5f9',
                      alignItems: 'flex-start'
                    }}
                  >
                    <List.Item.Meta
                      avatar={<span style={{ fontSize: '16px', marginTop: '2px', display: 'inline-block' }}>{icon}</span>}
                      title={
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569', lineHeight: '1.4' }}>
                          {item.type === 'answer' && (
                            <>
                              {item.content}{' '}
                              <Link 
                                to={`/questions/${item.questionId}`}
                                style={{ fontWeight: 600, color: '#4f46e5' }}
                              >
                                "{item.questionTitle}"
                              </Link>
                            </>
                          )}
                          {item.type === 'verify' && (
                            <>
                              {item.content}{' '}
                              <Link 
                                to={`/questions/${item.questionId}`}
                                style={{ fontWeight: 600, color: '#10b981' }}
                              >
                                "{item.questionTitle}"
                              </Link>
                            </>
                          )}
                          {item.type === 'view' && (
                            <>
                              Bài viết{' '}
                              <Link 
                                to={`/questions/${item.questionId}`}
                                style={{ fontWeight: 600, color: '#f59e0b' }}
                              >
                                "{item.questionTitle}"
                              </Link>{' '}
                              {item.content}
                            </>
                          )}
                        </span>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                          {dayjs(item.created_at).fromNow()}
                        </Text>
                      }
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có hoạt động nào gần đây" /> }}
            />
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