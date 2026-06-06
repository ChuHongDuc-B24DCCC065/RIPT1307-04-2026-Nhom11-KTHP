import React, { useState, useEffect } from 'react';
import { Tag, Space, Card, Typography, message, Empty, Skeleton, Input, Divider, Tooltip, Popover, Button, Avatar } from 'antd';
import { MessageOutlined, LikeOutlined, LikeFilled, UserOutlined, ClockCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

// --- Interface định nghĩa kiểu dữ liệu trả về từ API ---
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

const SearchAndFilterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const query = searchParams.get('q');
  const tag = searchParams.get('tag');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedQuestions, setLikedQuestions] = useState<Record<number, boolean>>({});
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

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

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (query) {
          endpoint = `/questions?search=${encodeURIComponent(query)}`;
        } else if (tag) {
          endpoint = `/questions?tag=${encodeURIComponent(tag)}`;
        } else {
          setQuestions([]);
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}`,
          { headers }
        );
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setQuestions(data);

        const initialLikes: Record<number, boolean> = {};
        data.forEach((q: Question) => {
          if (q.user_vote_type === 1) {
            initialLikes[q.id] = true;
          }
        });
        setLikedQuestions(initialLikes);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        message.error('Không thể lấy kết quả!');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    fetchTagCounts();
  }, [query, tag]);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 8px' }}>
      <Input.Search
        placeholder="Nhập từ khóa tìm kiếm..."
        allowClear
        enterButton="Tìm kiếm"
        size="large"
        defaultValue={query || ''}
        onSearch={handleSearch}
        style={{ 
          borderRadius: '14px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          fontSize: '15px',
          marginBottom: 28,
          overflow: 'hidden'
        }}
      />

      <Title level={3} style={{ marginBottom: 20 }}>
        {query && `Kết quả tìm kiếm cho: "${query}"`}
        {tag && `Các câu hỏi thuộc thẻ: #${tag}`}
        {!query && !tag && 'Tìm kiếm câu hỏi'}
      </Title>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} style={{ marginBottom: 16 }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        ))
      ) : questions.length === 0 ? (
        <Card>
          <Empty description="Không tìm thấy câu hỏi nào phù hợp." />
        </Card>
      ) : (
        <div className="so-questions-list-container">
          {questions.map((item) => {
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
      )}
    </div>
  );
};

export default SearchAndFilterPage;
