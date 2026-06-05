import React, { useState, useEffect } from 'react';
import { Tag, Space, Card, Typography, message, Empty, Skeleton, Divider } from 'antd';
import { MessageOutlined, LikeOutlined, UserOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface Question {
  id: number;
  title: string;
  description: string;
  tags: string;
  author: string;
  votes: number;
  answer_count?: number;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
}

const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để xem bài viết đã lưu!');
        navigate('/login');
        return;
      }
      
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/bookmarks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data?.success) {
        setQuestions(res.data.data);
      } else {
        setQuestions(res.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải bài viết đã lưu:', error);
      message.error('Không thể lấy danh sách bài viết đã lưu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 8px 40px 8px' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Link to="/" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>Trang chủ</Link>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>/</span>
        <Text style={{ color: '#6366f1', fontWeight: 600, fontSize: 13 }}>Bài viết đã lưu</Text>
      </div>

      {/* Header Panel */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        padding: '32px',
        borderRadius: '16px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            padding: '12px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <BookOutlined style={{ fontSize: '28px', color: '#ffffff' }} />
          </div>
          <div>
            <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
              Bài viết đã lưu
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', marginTop: '4px', display: 'block' }}>
              Danh sách các câu hỏi, thông báo học tập hoặc tài liệu bạn đã đánh dấu bookmark để xem lại sau.
            </Text>
          </div>
        </div>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} style={{ marginBottom: 16, borderRadius: '16px' }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        ))
      ) : questions.length === 0 ? (
        <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
          <Empty 
            description="Bạn chưa đánh dấu bài viết nào!" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        questions.map((item) => {
          const tagList = item.tags
            ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
            : [];
          return (
            <Card
              className="premium-card transition-all"
              key={item.id}
              style={{ marginBottom: 18, cursor: 'pointer', borderRadius: '16px' }}
              onClick={() => navigate(`/questions/${item.id}`)}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 8 }}>
                  <a
                    href={`/questions/${item.id}`}
                    style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6, transition: 'color 0.2s ease' }}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/questions/${item.id}`);
                    }}
                  >
                    {item.title}
                  </a>
                  <Space>
                    <UserOutlined style={{ color: '#94a3b8' }} />
                    <Text strong style={{ color: '#475569', fontSize: '13px' }}>{item.author || 'Ẩn danh'}</Text>
                  </Space>
                </div>
                {/* Tóm tắt nội dung */}
                <div style={{ margin: '12px 0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                  {item.description && item.description.length > 150
                    ? `${item.description.replace(/<[^>]*>/g, '').substring(0, 150)}...`
                    : item.description.replace(/<[^>]*>/g, '')}
                </div>
                {/* Thẻ tags */}
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 16 }}>
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
                <Divider style={{ margin: '8px 0' }} />
                <Space size="large" style={{ color: '#8c8c8c' }}>
                  <Space key="votes" style={{ color: '#4f46e5', fontWeight: 500 }}><LikeOutlined /> {item.votes ?? 0} Thích</Space>
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

export default BookmarksPage;
