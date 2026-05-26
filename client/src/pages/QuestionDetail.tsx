import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card, Typography, Tag, Space, Button, Divider,
  List, Avatar, Input, message, Row, Col, Skeleton, Empty, Select, Tooltip
} from 'antd';
import {
  LikeOutlined, LikeFilled, DislikeOutlined, DislikeFilled,
  MessageOutlined, UserOutlined, ClockCircleOutlined,
  ArrowLeftOutlined, SendOutlined, CheckCircleFilled,
  EyeOutlined, ShareAltOutlined, FlagOutlined,
  ThunderboltOutlined, GlobalOutlined, InfoCircleOutlined,
  FireOutlined, PlusOutlined
} from '@ant-design/icons';
import axios from 'axios';
import BookmarkButton from '../components/BookmarkButton';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- Interfaces khớp với dữ liệu trả về từ Backend ---
interface Comment {
  id: number;
  content: string;
  author: string;
  user_id: number;
  created_at: string;
}

interface Answer {
  id: number;
  content: string;
  votes: number;
  is_accepted: number;  // 0 | 1 từ MySQL TINYINT
  user_id: number;
  author: string;       // Từ LEFT JOIN users
  created_at: string;
  comments: Comment[];
}

interface Question {
  id: number;
  title: string;
  description: string;
  tags: string;         // Chuỗi "reactjs,nodejs"
  author: string;
  user_id: number;
  votes: number;
  views: number;
  created_at: string;
  answers: Answer[];
  answer_count?: number;
}

// --- Helper: Format thời gian tương đối ---
const formatTime = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff} giây trước`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

// --- Helper: Get random gradient for avatars ---
const getAvatarGradient = (username: string) => {
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo -> Purple
    'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue -> Cyan
    'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald -> Green
    'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)', // Amber -> Rose
    'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // Pink -> Rose
  ];
  return gradients[hash % gradients.length];
};

// --- Helper: Map dynamic user details based on username for premium feel ---
interface UserDetails {
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  points: number;
}
const getUserDetails = (username: string): UserDetails => {
  const name = username ? username.trim() : '';
  if (name.toLowerCase() === 'minh phúc' || name.toLowerCase() === 'minhphuc') {
    return {
      title: 'Senior Frontend Engineer',
      badge: 'Top Contributor',
      badgeColor: '#7c3aed',
      badgeBg: '#f3e8ff',
      points: 2450
    };
  }
  if (name.toLowerCase() === 'hoàng anh' || name.toLowerCase() === 'hoanganh') {
    return {
      title: 'Tech Lead & Architect',
      badge: 'Chuyên gia',
      badgeColor: '#10b981',
      badgeBg: '#ecfdf5',
      points: 3120
    };
  }
  if (name.toLowerCase() === 'thanh hằng' || name.toLowerCase() === 'thanhhang') {
    return {
      title: 'Senior UI/UX Designer',
      badge: 'Đóng góp vàng',
      badgeColor: '#f43f5e',
      badgeBg: '#fff1f2',
      points: 1890
    };
  }
  if (name.toLowerCase() === 'quốc trung' || name.toLowerCase() === 'quoctrung') {
    return {
      title: 'Backend Engineer',
      badge: 'Thành viên tích cực',
      badgeColor: '#3b82f6',
      badgeBg: '#eff6ff',
      points: 1420
    };
  }
  // Default values
  return {
    title: 'Kỹ sư phần mềm',
    badge: 'Thành viên',
    badgeColor: '#64748b',
    badgeBg: '#f1f5f9',
    points: 350
  };
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  // --- Refs ---
  const answerEditorRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading]   = useState(true);
  const [answerText, setAnswerText]             = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [isLiked, setIsLiked]                   = useState(false);
  const [isDisliked, setIsDisliked]             = useState(false);
  const [commentTexts, setCommentTexts]         = useState<Record<number, string>>({});
  const [showComment, setShowComment]           = useState<Record<number, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<number | null>(null);
  const [sortBy, setSortBy]                     = useState<'votes' | 'newest'>('votes');
  const [allQuestions, setAllQuestions]         = useState<Question[]>([]);
  const [followedAuthors, setFollowedAuthors]   = useState<Record<string, boolean>>({});

  // --- Lấy chi tiết câu hỏi từ API ---
  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/questions/${id}`);
      setQuestion(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setQuestion(null);
      } else {
        message.error('Không thể tải câu hỏi!');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Tải danh sách tất cả câu hỏi để tìm các câu hỏi liên quan ---
  const fetchAllQuestions = async () => {
    try {
      const res = await axios.get(`${API}/questions`);
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setAllQuestions(data);
    } catch (err) {
      console.error('Lỗi tải danh sách liên quan:', err);
    }
  };

  useEffect(() => {
    fetchQuestion();
    fetchAllQuestions();
  }, [id]);

  // --- Vote câu hỏi ---
  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đánh giá câu hỏi!');
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(
        `${API}/questions/${id}/vote`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestion(prev => prev ? { ...prev, votes: res.data.votes } : prev);
      
      if (type === 'up') {
        setIsLiked(!isLiked);
        setIsDisliked(false);
        message.success(isLiked ? 'Đã bỏ thích câu hỏi!' : 'Đã thích câu hỏi!');
      } else {
        setIsDisliked(!isDisliked);
        setIsLiked(false);
        message.success(isDisliked ? 'Đã bỏ không thích!' : 'Đã phản hồi không thích câu hỏi!');
      }
    } catch {
      message.error('Không thể thực hiện đánh giá câu hỏi!');
    }
  };

  // --- Vote câu trả lời ---
  const handleVoteAnswer = async (answerId: number, type: 'up' | 'down') => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đánh giá câu trả lời!');
      return;
    }
    try {
      const res = await axios.post(
        `${API}/questions/${id}/answers/${answerId}/vote`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestion(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map(a =>
            a.id === answerId ? { ...a, votes: res.data.votes } : a
          )
        };
      });
      message.success(type === 'up' ? 'Đã thích câu trả lời!' : 'Đã gửi phản hồi đánh giá!');
    } catch {
      message.error('Không thể bình chọn câu trả lời!');
    }
  };

  // --- Chấp nhận câu trả lời (chỉ tác giả) ---
  const handleAcceptAnswer = async (answerId: number) => {
    try {
      await axios.patch(
        `${API}/questions/${id}/answers/${answerId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đã chấp nhận câu trả lời này làm giải pháp!');
      fetchQuestion();
    } catch {
      message.error('Không thể chấp nhận câu trả lời!');
    }
  };

  // --- Đăng câu trả lời mới ---
  const handlePostAnswer = async () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để trả lời!');
      navigate('/login');
      return;
    }
    if (!answerText.trim()) {
      message.warning('Vui lòng nhập nội dung câu trả lời!');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/questions/${id}/answers`,
        { content: answerText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đăng câu trả lời thành công!');
      setAnswerText('');
      fetchQuestion();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể đăng câu trả lời!');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Đăng bình luận vào câu trả lời ---
  const handlePostComment = async (answerId: number) => {
    const content = (commentTexts[answerId] || '').trim();
    if (!content) { message.warning('Vui lòng nhập bình luận!'); return; }
    if (!user) { message.warning('Bạn cần đăng nhập!'); navigate('/login'); return; }
    setSubmittingComment(answerId);
    try {
      await axios.post(
        `${API}/questions/${id}/answers/${answerId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đã đăng bình luận!');
      setCommentTexts(prev => ({ ...prev, [answerId]: '' }));
      setShowComment(prev => ({ ...prev, [answerId]: false }));
      fetchQuestion();
    } catch {
      message.error('Không thể đăng bình luận!');
    } finally {
      setSubmittingComment(null);
    }
  };

  // --- Theo dõi tác giả ---
  const handleFollowAuthor = (authorName: string) => {
    setFollowedAuthors(prev => {
      const current = !!prev[authorName];
      message.success(current ? `Đã bỏ theo dõi ${authorName}` : `Bắt đầu theo dõi ${authorName}!`);
      return { ...prev, [authorName]: !current };
    });
  };

  // --- Chia sẻ câu hỏi ---
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Đã sao chép liên kết vào bộ nhớ tạm!');
  };

  // --- Cuộn tới khung trả lời ---
  const scrollToEditor = () => {
    if (answerEditorRef.current) {
      answerEditorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={17}>
            <Card style={{ borderRadius: '20px', marginBottom: 20 }}><Skeleton active avatar paragraph={{ rows: 8 }} /></Card>
            <Card style={{ borderRadius: '20px' }}><Skeleton active paragraph={{ rows: 4 }} /></Card>
          </Col>
          <Col xs={24} lg={7}>
            <Card style={{ borderRadius: '20px', marginBottom: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></Card>
            <Card style={{ borderRadius: '20px' }}><Skeleton active paragraph={{ rows: 3 }} /></Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', background: '#fff', borderRadius: 20, maxWidth: 600, margin: '60px auto' }}>
        <Empty description="Không tìm thấy câu hỏi này" />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 24, borderRadius: '10px', height: 40, fontWeight: 600 }}>
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  const tagList = question.tags
    ? question.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  const isOwner = user?.id === question.user_id;

  // Lọc các câu hỏi liên quan cùng chung thẻ tags
  const relatedQuestions = allQuestions
    .filter(q => q.id !== question.id)
    .filter(q => {
      const qTags = q.tags ? q.tags.split(',').map(t => t.trim().toLowerCase()) : [];
      return qTags.some(t => tagList.map(item => item.toLowerCase()).includes(t));
    })
    .slice(0, 4);

  // Sắp xếp các câu trả lời
  const sortedAnswers = question.answers ? [...question.answers].sort((a, b) => {
    // Câu trả lời được tác giả chấp nhận luôn đưa lên đầu
    if (a.is_accepted !== b.is_accepted) {
      return b.is_accepted - a.is_accepted;
    }
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  }) : [];

  const authorDetails = getUserDetails(question.author);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px 40px 8px' }}>
      
      {/* ==================== BREADCRUMBS SANG TRỌNG ==================== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>/</span>
        <Link to="/search" className="breadcrumb-link">Câu hỏi</Link>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>/</span>
        <Text ellipsis style={{ maxWidth: 300, color: '#4f46e5', fontWeight: 600, fontSize: 13 }}>
          {question.title}
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        
        {/* ======================================================== */}
        {/* CỘT CHÍNH TRÁI (NỘI DUNG CHI TIẾT & CÂU TRẢ LỜI) - 70%   */}
        {/* ======================================================== */}
        <Col xs={24} lg={17}>
          
          {/* Back Button */}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            type="text"
            className="transition-all"
            style={{ 
              marginBottom: 16, 
              fontWeight: 600, 
              color: '#64748b',
              paddingLeft: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: '8px'
            }}
          >
            Quay lại trang chủ
          </Button>

          {/* ===== Card Chi Tiết Câu Hỏi ===== */}
          <Card 
            bordered={false} 
            className="premium-card animated-hover-card"
            style={{ 
              marginBottom: 24, 
              borderRadius: '24px', 
              padding: '12px 16px 20px 16px'
            }}
          >
            <Row gutter={[20, 20]} wrap={false}>
              {/* Cột bình chọn (Vote) trái */}
              <Col style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56, flexShrink: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginTop: '4px',
                  background: '#f8fafc',
                  padding: '8px 6px',
                  borderRadius: '999px',
                  border: '1px solid #f1f5f9'
                }}>
                  <Tooltip title="Thích câu hỏi này">
                    <Button
                      icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                      shape="circle"
                      size="middle"
                      className={`transition-all ${isLiked ? 'vote-btn-active' : ''}`}
                      style={{ 
                        border: 'none', 
                        background: 'transparent',
                        color: isLiked ? '#6366f1' : '#64748b'
                      }}
                      onClick={() => handleVote('up')}
                    />
                  </Tooltip>
                  <Text strong style={{ fontSize: 18, color: '#1e293b', margin: '2px 0' }}>{question.votes}</Text>
                  <Tooltip title="Không thích câu hỏi">
                    <Button
                      icon={isDisliked ? <DislikeFilled /> : <DislikeOutlined />}
                      shape="circle"
                      size="middle"
                      className={`transition-all ${isDisliked ? 'vote-btn-active' : ''}`}
                      style={{ 
                        border: 'none', 
                        background: 'transparent',
                        color: isDisliked ? '#ef4444' : '#64748b'
                      }}
                      onClick={() => handleVote('down')}
                    />
                  </Tooltip>
                </div>
              </Col>

              {/* Cột nội dung câu hỏi */}
              <Col flex="auto" style={{ paddingLeft: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <Title level={1} style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '24px', lineHeight: '1.4', letterSpacing: '-0.5px' }}>
                    {question.title}
                  </Title>
                  <div style={{ flexShrink: 0 }}>
                    {id && <BookmarkButton questionId={id} style={{ transform: 'scale(1.1)' }} />}
                  </div>
                </div>

                {/* Meta info bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '14px 0 20px 0', borderBottom: '1px dashed #f1f5f9', paddingBottom: 16 }}>
                  <Space><UserOutlined style={{ color: '#94a3b8' }} /> <Text strong style={{ color: '#475569', fontSize: 13.5 }}>{question.author}</Text></Space>
                  <Space><ClockCircleOutlined style={{ color: '#94a3b8' }} /> <Text type="secondary" style={{ fontSize: 13 }}>{formatTime(question.created_at)}</Text></Space>
                  <Space><EyeOutlined style={{ color: '#94a3b8' }} /> <Text type="secondary" style={{ fontSize: 13 }}>{question.views ?? 0} lượt xem</Text></Space>
                  <Space><MessageOutlined style={{ color: '#94a3b8' }} /> <Text type="secondary" style={{ fontSize: 13 }}>{question.answers?.length ?? 0} trả lời</Text></Space>
                </div>

                {/* Nội dung chi tiết */}
                <Paragraph className="premium-description" style={{ fontSize: 15.5, lineHeight: '1.8', color: '#334155', marginBottom: 28 }}>
                  {question.description}
                </Paragraph>

                {/* Thẻ tags & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tagList.map(tag => (
                      <Tag 
                        color="purple" 
                        key={tag} 
                        className="sidebar-tag transition-all"
                        style={{ 
                          borderRadius: '8px', 
                          padding: '5px 14px', 
                          fontSize: '13px',
                          fontWeight: 500,
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/search?tag=${tag}`)}
                      >
                        #{tag}
                      </Tag>
                    ))}
                  </div>

                  {/* Actions buttons */}
                  <Space size="middle">
                    <Button 
                      type="text" 
                      icon={<ShareAltOutlined />} 
                      onClick={handleShare}
                      style={{ color: '#64748b', fontWeight: 500, borderRadius: 8 }}
                      className="transition-all"
                    >
                      Chia sẻ
                    </Button>
                    <Button 
                      type="text" 
                      icon={<FlagOutlined />} 
                      style={{ color: '#64748b', fontWeight: 500, borderRadius: 8 }}
                      onClick={() => message.info('Đã ghi nhận báo cáo nội dung câu hỏi!')}
                    >
                      Báo cáo
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>

          {/* ===== Danh Sách Câu Trả Lời ===== */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageOutlined style={{ color: '#6366f1' }} /> 
              <span>{question.answers?.length ?? 0} Câu trả lời</span>
            </Title>
            
            {/* Sorting Selection */}
            <Select 
              value={sortBy} 
              onChange={(value: 'votes' | 'newest') => setSortBy(value)}
              style={{ width: 180 }}
              options={[
                { value: 'votes', label: 'Bình chọn nhiều nhất' },
                { value: 'newest', label: 'Mới nhất đầu tiên' }
              ]}
              className="premium-select"
            />
          </div>

          {sortedAnswers.length === 0 ? (
            <Card style={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', textAlign: 'center', padding: '40px 24px', marginBottom: 28 }}>
              <Empty description="Chưa có câu trả lời nào cho câu hỏi này. Hãy là người đầu tiên giúp đỡ!" style={{ padding: '16px' }} />
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={scrollToEditor} style={{ marginTop: 12, borderRadius: 10, height: 38, background: '#6366f1' }}>
                Đóng góp câu trả lời ngay
              </Button>
            </Card>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={sortedAnswers}
              renderItem={(answer) => {
                const isAccepted = answer.is_accepted === 1;
                const answerAuthorDetails = getUserDetails(answer.author);
                return (
                  <Card
                    key={answer.id}
                    bordered={false}
                    className={`premium-card animated-hover-card ${isAccepted ? 'glow-accepted' : ''}`}
                    style={{
                      borderRadius: '20px',
                      padding: '8px 12px',
                      marginBottom: 20
                    }}
                  >
                    <Row gutter={16} wrap={false}>
                      {/* Cột vote câu trả lời */}
                      <Col style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, flexShrink: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <Tooltip title="Câu trả lời hữu ích">
                            <Button
                              icon={<LikeOutlined />}
                              size="small"
                              shape="circle"
                              style={{ backgroundColor: '#f1f5f9', border: 'none', color: '#475569' }}
                              onClick={() => handleVoteAnswer(answer.id, 'up')}
                            />
                          </Tooltip>
                          <Text strong style={{ color: '#1e293b', fontSize: 15 }}>{answer.votes}</Text>
                          <Tooltip title="Không hữu ích">
                            <Button
                              icon={<DislikeOutlined />}
                              size="small"
                              shape="circle"
                              style={{ backgroundColor: '#f1f5f9', border: 'none', color: '#475569' }}
                              onClick={() => handleVoteAnswer(answer.id, 'down')}
                            />
                          </Tooltip>
                          
                          {/* Nút chấp nhận câu trả lời (chỉ tác giả câu hỏi) */}
                          {isOwner && (
                            <Tooltip title={isAccepted ? 'Hủy chấp nhận giải pháp này' : 'Chấp nhận làm giải pháp tốt nhất'}>
                              <Button
                                icon={<CheckCircleFilled />}
                                size="small"
                                shape="circle"
                                type={isAccepted ? 'primary' : 'default'}
                                style={{ 
                                  color: isAccepted ? '#22c55e' : '#cbd5e1', 
                                  marginTop: 12,
                                  borderColor: isAccepted ? '#22c55e' : '#e2e8f0',
                                  boxShadow: isAccepted ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
                                }}
                                onClick={() => handleAcceptAnswer(answer.id)}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </Col>
                      
                      {/* Nội dung câu trả lời */}
                      <Col flex="auto" style={{ paddingLeft: 12 }}>
                        {isAccepted && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: 12 }}>
                            <CheckCircleFilled /> GIẢI PHÁP ĐƯỢC CHẤP NHẬN
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          {/* Profile tác giả câu trả lời */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar 
                              size={40}
                              style={{ 
                                background: getAvatarGradient(answer.author || 'A'), 
                                color: '#ffffff', 
                                fontWeight: 700,
                                border: '2px solid #ffffff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                              }} 
                            >
                              {(answer.author || 'Ẩn danh').charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Text strong style={{ color: '#1e293b', fontSize: '14.5px' }}>{answer.author || 'Ẩn danh'}</Text>
                                <Tag bordered={false} style={{ color: answerAuthorDetails.badgeColor, backgroundColor: answerAuthorDetails.badgeBg, fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '0 6px' }}>
                                  {answerAuthorDetails.badge}
                                </Tag>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                                <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{answerAuthorDetails.title}</span>
                                <span style={{ color: '#cbd5e1', fontSize: 10 }}>•</span>
                                <span style={{ fontSize: 11.5, color: '#f59e0b', fontWeight: 600 }}>★ {answerAuthorDetails.points}đ</span>
                              </div>
                            </div>
                          </div>

                          <Text type="secondary" style={{ fontSize: 12.5 }}>
                            {formatTime(answer.created_at)}
                          </Text>
                        </div>
                        
                        {/* Nội dung câu trả lời */}
                        <Paragraph style={{ fontSize: 15, color: '#334155', marginTop: 10, marginBottom: 18, lineHeight: '1.75' }}>
                          {answer.content}
                        </Paragraph>
                        
                        {/* === Mục bình luận (Comments) === */}
                        <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                          {answer.comments && answer.comments.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                              {answer.comments.map(c => (
                                <div key={c.id} className="premium-comment-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: '10px' }}>
                                  <Avatar 
                                    size={20}
                                    style={{ 
                                      background: getAvatarGradient(c.author || 'C'), 
                                      fontSize: 10, 
                                      fontWeight: 'bold' 
                                    }}
                                  >
                                    {(c.author || 'A').charAt(0).toUpperCase()}
                                  </Avatar>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text strong style={{ fontSize: 12.5, color: '#1e293b' }}>{c.author}</Text>
                                      <Text type="secondary" style={{ fontSize: 11 }}>
                                        {formatTime(c.created_at)}
                                      </Text>
                                    </div>
                                    <Paragraph style={{ margin: '4px 0 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                                      {c.content}
                                    </Paragraph>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Nút / Thanh bình luận */}
                          {user ? (
                            showComment[answer.id] ? (
                              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <Input
                                  placeholder="Nhập câu bình luận đóng góp ý kiến của bạn..."
                                  value={commentTexts[answer.id] || ''}
                                  onChange={e => setCommentTexts(prev => ({ ...prev, [answer.id]: e.target.value }))}
                                  onPressEnter={() => handlePostComment(answer.id)}
                                  style={{ borderRadius: '10px', height: 38 }}
                                />
                                <Button 
                                  type="primary"
                                  loading={submittingComment === answer.id}
                                  onClick={() => handlePostComment(answer.id)}
                                  style={{ borderRadius: '10px', height: 38, background: '#6366f1' }}
                                >
                                  Gửi
                                </Button>
                                <Button 
                                  onClick={() => setShowComment(prev => ({ ...prev, [answer.id]: false }))}
                                  style={{ borderRadius: '10px', height: 38 }}
                                >
                                  Hủy
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                type="text" 
                                size="small"
                                icon={<PlusOutlined style={{ fontSize: 11 }} />}
                                style={{ padding: '2px 8px', fontSize: 12.5, height: 'auto', color: '#6366f1', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                onClick={() => setShowComment(prev => ({ ...prev, [answer.id]: true }))}
                              >
                                Viết bình luận
                              </Button>
                            )
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                );
              }}
            />
          )}

          {/* ===== Viết Câu Trả Lời Mới ===== */}
          <div ref={answerEditorRef}>
            <Card
              title={
                <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ThunderboltOutlined style={{ color: '#eab308' }} />
                  Đóng góp câu trả lời của bạn
                </Title>
              }
              bordered={false}
              className="premium-card animated-hover-card"
              style={{ 
                borderRadius: '24px', 
                padding: '12px 16px 20px 16px',
                marginTop: 28
              }}
            >
              {user ? (
                <>
                  <TextArea
                    rows={5}
                    placeholder="Nhập câu trả lời chi tiết, mã nguồn minh họa và giải pháp đầy đủ để giúp đỡ cộng đồng..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    style={{ marginBottom: 20, fontSize: 15, borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <InfoCircleOutlined style={{ color: '#6366f1' }} />
                      Vui lòng duy trì văn hóa giao tiếp văn minh, tôn trọng.
                    </Text>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handlePostAnswer}
                      loading={submitting}
                      size="large"
                      style={{
                        borderRadius: '12px',
                        height: '44px',
                        fontWeight: 600,
                        padding: '0 24px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        borderColor: '#6366f1',
                        boxShadow: '0 6px 16px rgba(99, 102, 241, 0.25)'
                      }}
                    >
                      Gửi câu trả lời của bạn
                    </Button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Text type="secondary" style={{ fontSize: '15px' }}>Bạn cần </Text>
                  <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, fontSize: '15px', fontWeight: 700, color: '#6366f1' }}>
                    đăng nhập
                  </Button>
                  <Text type="secondary" style={{ fontSize: '15px' }}> để đóng góp câu trả lời cho câu hỏi này.</Text>
                </div>
              )}
            </Card>
          </div>
        </Col>

        {/* ======================================================== */}
        {/* CỘT PHẢI (SIDEBAR WIDGETS) - 30%                         */}
        {/* ======================================================== */}
        <Col xs={24} lg={7} style={{ position: 'sticky', top: 96, height: 'fit-content' }}>
          
          {/* WIDGET 1: THỐNG KÊ CÂU HỎI */}
          <Card
            title={
              <div style={{ fontSize: 14, fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>
                THỐNG KÊ CÂU HỎI
              </div>
            }
            bordered={false}
            className="premium-card animated-hover-card"
            style={{ borderRadius: '20px', marginBottom: 20, padding: '4px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 12px' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>ĐÃ HỎI</Text>
                <Text strong style={{ fontSize: 13.5, color: '#1e293b' }}>
                  {new Date(question.created_at).toLocaleDateString('vi-VN')}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>XEM</Text>
                <Text strong style={{ fontSize: 13.5, color: '#1e293b' }}>
                  {question.views ?? 0} lần
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>HOẠT ĐỘNG</Text>
                <Text strong style={{ fontSize: 13.5, color: '#1e293b' }}>
                  {formatTime(question.answers?.[0]?.created_at || question.created_at)}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>PHIÊN BẢN</Text>
                <Text strong style={{ fontSize: 13.5, color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GlobalOutlined style={{ fontSize: 12 }} /> React v19.2
                </Text>
              </div>
            </div>
          </Card>

          {/* WIDGET 2: NGƯỜI ĐĂNG */}
          <Card
            title={
              <div style={{ fontSize: 14, fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>
                NGƯỜI ĐĂNG
              </div>
            }
            bordered={false}
            className="premium-card animated-hover-card"
            style={{ borderRadius: '20px', marginBottom: 20, padding: '6px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Avatar 
                  size={52} 
                  style={{ 
                    background: getAvatarGradient(question.author), 
                    color: '#ffffff', 
                    fontWeight: 800,
                    fontSize: 22,
                    border: '2px solid #ffffff',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  {question.author?.charAt(0).toUpperCase()}
                </Avatar>
                <div className="status-indicator-dot" style={{ bottom: 3, right: 3, width: 12, height: 12 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: 15.5, color: '#0f172a' }}>{question.author}</Text>
                  <Tag bordered={false} style={{ color: authorDetails.badgeColor, backgroundColor: authorDetails.badgeBg, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '0 5px' }}>
                    {authorDetails.badge}
                  </Tag>
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {authorDetails.title}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>★ {authorDetails.points}đ uy tín</Text>
                </div>
              </div>
            </div>
            
            <Divider style={{ margin: '14px 0' }} />
            
            <Button 
              type={followedAuthors[question.author] ? 'default' : 'primary'}
              ghost={followedAuthors[question.author]}
              style={{ 
                width: '100%', 
                borderRadius: '10px', 
                height: '38px', 
                fontWeight: 600,
                borderColor: followedAuthors[question.author] ? '#6366f1' : 'transparent',
                color: followedAuthors[question.author] ? '#6366f1' : undefined
              }}
              onClick={() => handleFollowAuthor(question.author)}
            >
              {followedAuthors[question.author] ? 'Đang theo dõi ✓' : 'Theo dõi tác giả'}
            </Button>
          </Card>

          {/* WIDGET 3: CÂU HỎI LIÊN QUAN */}
          {relatedQuestions.length > 0 && (
            <Card
              title={
                <div style={{ fontSize: 14, fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>
                  CÂU HỎI LIÊN QUAN
                </div>
              }
              bordered={false}
              className="premium-card animated-hover-card"
              style={{ borderRadius: '20px', marginBottom: 20, padding: '4px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {relatedQuestions.map(rq => (
                  <div key={rq.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Link 
                      to={`/questions/${rq.id}`}
                      style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}
                      className="discussion-title-hover transition-all"
                    >
                      {rq.title}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                      <span>{rq.votes ?? 0} lượt thích</span>
                      <span>•</span>
                      <span>{rq.answer_count ?? 0} bình luận</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* WIDGET 4: BẠN CÓ GIẢI PHÁP TỐT HƠN? */}
          <Card
            bordered={false}
            className="glow-cta"
            style={{ 
              borderRadius: '20px', 
              padding: '16px 20px',
              textAlign: 'center'
            }}
          >
            <FireOutlined style={{ fontSize: 32, color: '#eab308', marginBottom: 12, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }} />
            <Title level={4} style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '17px', fontWeight: 800 }}>
              Bạn có giải pháp tốt hơn?
            </Title>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 18px 0' }}>
              Hãy chia sẻ kiến thức hữu ích của bạn để giúp nhà phát triển khác và nhận thêm điểm uy tín!
            </p>
            <Button
              type="default"
              style={{
                width: '100%',
                borderRadius: '10px',
                height: '38px',
                fontWeight: 700,
                color: '#6366f1',
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
              }}
              onClick={scrollToEditor}
            >
              Đóng góp ngay
            </Button>
          </Card>

        </Col>

      </Row>
    </div>
  );
};

export default QuestionDetail;