import React, { useState, useEffect } from 'react';
import { Tag, Space, Card, Typography, message, Empty, Skeleton, Input, Divider, Tooltip } from 'antd';
import { MessageOutlined, LikeOutlined, LikeFilled, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
        questions.map((item) => {
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
        })
      )}
    </div>
  );
};

export default SearchAndFilterPage;
