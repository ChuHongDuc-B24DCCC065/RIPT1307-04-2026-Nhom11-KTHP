import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Tag, Space, Button, Divider,
  List, Avatar, Input, message, Row, Col, Skeleton, Empty
} from 'antd';
import {
  LikeOutlined, LikeFilled, DislikeOutlined,
  MessageOutlined, UserOutlined, ClockCircleOutlined,
  ArrowLeftOutlined, SendOutlined, CheckCircleFilled
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
}

// --- Helper: Format thời gian tương đối ---
const formatTime = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff} giây trước`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  // --- State ---
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading]   = useState(true);
  const [answerText, setAnswerText]             = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [isLiked, setIsLiked]                   = useState(false);
  const [commentTexts, setCommentTexts]         = useState<Record<number, string>>({});
  const [showComment, setShowComment]           = useState<Record<number, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<number | null>(null);

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

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  // --- Vote câu hỏi ---
  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để vote!');
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
      setIsLiked(type === 'up' ? !isLiked : false);
      message.success(type === 'up' ? 'Đã thích câu hỏi!' : 'Đã bỏ thích câu hỏi!');
    } catch {
      message.error('Không thể thực hiện đánh giá câu hỏi!');
    }
  };

  // --- Vote câu trả lời ---
  const handleVoteAnswer = async (answerId: number, type: 'up' | 'down') => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để vote!');
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
    } catch {
      message.error('Không thể vote câu trả lời!');
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
      message.success('Đã chấp nhận câu trả lời!');
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
      message.warning('Vui lòng nhập câu trả lời!');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/questions/${id}/answers`,
        { content: answerText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đã đăng câu trả lời thành công!');
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

  if (loading) {
    return (
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '12px' }}>
        <Card style={{ borderRadius: '20px' }}><Skeleton active avatar paragraph={{ rows: 6 }} /></Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Empty description="Không tìm thấy câu hỏi này" />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 20, borderRadius: '8px' }}>
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  const tagList = question.tags
    ? question.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  const isOwner = user?.id === question.user_id;

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '12px' }}>
      
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        type="text"
        style={{ marginBottom: 20, fontWeight: 600, color: '#64748b' }}
      >
        Quay lại trang chủ
      </Button>

      {/* ===== Card Chi Tiết Câu Hỏi ===== */}
      <Card 
        bordered={false} 
        style={{ 
          marginBottom: 28, 
          borderRadius: '20px', 
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)',
          border: '1px solid #e2e8f0',
          padding: '8px'
        }}
      >
        <Row gutter={[24, 24]}>
          {/* Cột bình chọn (Vote) */}
          <Col xs={4} sm={2} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: '8px' }}>
              <Button
                icon={isLiked ? <LikeFilled style={{ color: '#4f46e5' }} /> : <LikeOutlined />}
                shape="circle"
                size="large"
                style={{ 
                  backgroundColor: isLiked ? '#e0e7ff' : '#f1f5f9', 
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                }}
                onClick={() => handleVote('up')}
              />
              <Text strong style={{ fontSize: 22, color: '#1e293b' }}>{question.votes}</Text>
              <Button
                icon={<DislikeOutlined />}
                shape="circle"
                size="large"
                style={{ backgroundColor: '#f1f5f9', border: 'none' }}
                onClick={() => handleVote('down')}
              />
            </div>
          </Col>

          {/* Cột nội dung câu hỏi */}
          <Col xs={20} sm={22}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '24px', letterSpacing: '-0.5px' }}>{question.title}</Title>
              {id && <BookmarkButton questionId={id} style={{ marginLeft: 16 }} />}
            </div>

            {/* Meta info */}
            <Space split={<Divider type="vertical" />} style={{ margin: '14px 0 20px 0' }} wrap>
              <Space><UserOutlined style={{ color: '#94a3b8' }} /> <Text strong style={{ color: '#475569' }}>{question.author}</Text></Space>
              <Space><ClockCircleOutlined style={{ color: '#94a3b8' }} /> <Text type="secondary">{formatTime(question.created_at)}</Text></Space>
              <Space><MessageOutlined style={{ color: '#94a3b8' }} /> <Text type="secondary">{question.answers?.length ?? 0} Trả lời</Text></Space>
            </Space>

            {/* Nội dung chi tiết */}
            <Paragraph style={{ fontSize: 16, lineHeight: '1.8', color: '#334155', marginBottom: 24 }}>
              {question.description}
            </Paragraph>

            {/* Thẻ tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tagList.map(tag => (
                <Tag 
                  color="purple" 
                  key={tag} 
                  style={{ 
                    borderRadius: '6px', 
                    padding: '4px 12px', 
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
          </Col>
        </Row>
      </Card>

      {/* ===== Danh Sách Câu Trả Lời ===== */}
      <Card
        title={
          <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageOutlined style={{ color: '#4f46e5' }} /> 
            <span>{question.answers?.length ?? 0} Câu trả lời</span>
          </Title>
        }
        bordered={false}
        style={{ 
          marginBottom: 28, 
          borderRadius: '20px', 
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)',
          border: '1px solid #e2e8f0',
          padding: '8px'
        }}
      >
        {question.answers?.length === 0 ? (
          <Empty description="Chưa có câu trả lời nào cho câu hỏi này. Hãy là người đầu tiên trả lời!" style={{ padding: '24px' }} />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={question.answers}
            renderItem={(answer) => (
              <List.Item
                key={answer.id}
                style={{
                  background: answer.is_accepted ? '#f0fdf4' : 'transparent',
                  borderRadius: '14px',
                  padding: 20,
                  marginBottom: 16,
                  border: answer.is_accepted ? '1px solid #bbf7d0' : '1px solid #f1f5f9'
                }}
              >
                <Row gutter={16}>
                  {/* Vote answer */}
                  <Col xs={4} sm={2} style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Button
                        icon={<LikeOutlined />}
                        size="small"
                        shape="circle"
                        style={{ backgroundColor: '#f1f5f9', border: 'none' }}
                        onClick={() => handleVoteAnswer(answer.id, 'up')}
                      />
                      <Text strong style={{ color: '#1e293b' }}>{answer.votes}</Text>
                      <Button
                        icon={<DislikeOutlined />}
                        size="small"
                        shape="circle"
                        style={{ backgroundColor: '#f1f5f9', border: 'none' }}
                        onClick={() => handleVoteAnswer(answer.id, 'down')}
                      />
                      
                      {/* Nút chấp nhận câu trả lời (chỉ tác giả) */}
                      {isOwner && (
                        <Button
                          icon={<CheckCircleFilled />}
                          size="small"
                          shape="circle"
                          type={answer.is_accepted ? 'primary' : 'default'}
                          style={{ 
                            color: answer.is_accepted ? '#22c55e' : undefined, 
                            marginTop: 10,
                            borderColor: answer.is_accepted ? '#22c55e' : undefined
                          }}
                          title="Chấp nhận câu trả lời này"
                          onClick={() => handleAcceptAnswer(answer.id)}
                        />
                      )}
                    </div>
                  </Col>
                  
                  {/* Nội dung câu trả lời */}
                  <Col xs={20} sm={22}>
                    {answer.is_accepted === 1 && (
                      <Tag color="success" style={{ marginBottom: 12, borderRadius: '6px', fontWeight: 600 }}>
                        <CheckCircleFilled /> Giải pháp được chấp nhận
                      </Tag>
                    )}
                    
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<UserOutlined />} 
                          style={{ backgroundColor: '#e0e7ff', color: '#6366f1', fontWeight: 600 }} 
                        >
                          {answer.author?.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <Space size="middle" style={{ marginTop: '2px' }}>
                          <Text strong style={{ color: '#1e293b', fontSize: '14.5px' }}>{answer.author || 'Ẩn danh'}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTime(answer.created_at)}
                          </Text>
                        </Space>
                      }
                      description={
                        <Paragraph style={{ fontSize: 15, color: '#334155', marginTop: 10, marginBottom: 0, lineHeight: '1.7' }}>
                          {answer.content}
                        </Paragraph>
                      }
                    />
                    
                    {/* === Mục bình luận (Comments) === */}
                    <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                      {answer.comments?.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: 13, background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                          <UserOutlined style={{ color: '#94a3b8', marginTop: 3, flexShrink: 0 }} />
                          <span style={{ flex: 1, color: '#475569', lineHeight: '1.5' }}>
                            <Text strong style={{ fontSize: 13, color: '#1e293b' }}>{c.author}</Text>
                            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                            {c.content}
                          </span>
                          <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                            {formatTime(c.created_at)}
                          </Text>
                        </div>
                      ))}
                      
                      {/* Thêm bình luận */}
                      {user ? (
                        showComment[answer.id] ? (
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <Input
                              placeholder="Nhập câu bình luận của bạn..."
                              value={commentTexts[answer.id] || ''}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [answer.id]: e.target.value }))}
                              onPressEnter={() => handlePostComment(answer.id)}
                              style={{ borderRadius: '8px' }}
                            />
                            <Button 
                              type="primary"
                              loading={submittingComment === answer.id}
                              onClick={() => handlePostComment(answer.id)}
                              style={{ borderRadius: '8px' }}
                            >
                              Gửi
                            </Button>
                            <Button 
                              onClick={() => setShowComment(prev => ({ ...prev, [answer.id]: false }))}
                              style={{ borderRadius: '8px' }}
                            >
                              Hủy
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            type="link" 
                            size="small"
                            style={{ padding: 0, fontSize: 12.5, height: 'auto', color: '#6366f1', fontWeight: 500, marginTop: '4px' }}
                            onClick={() => setShowComment(prev => ({ ...prev, [answer.id]: true }))}
                          >
                            + Viết bình luận
                          </Button>
                        )
                      ) : null}
                    </div>
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* ===== Viết Câu Trả Lời Mới ===== */}
      <Card
        title={<Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Đóng góp câu trả lời của bạn</Title>}
        bordered={false}
        style={{ 
          borderRadius: '20px', 
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)',
          border: '1px solid #e2e8f0',
          padding: '8px'
        }}
      >
        {user ? (
          <>
            <TextArea
              rows={5}
              placeholder="Nhập câu trả lời chi tiết và giải pháp của bạn ở đây..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              style={{ marginBottom: 20, fontSize: 15, borderRadius: '12px', padding: '12px' }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePostAnswer}
              loading={submitting}
              size="large"
              style={{
                borderRadius: '10px',
                height: '42px',
                fontWeight: 600,
                background: '#6366f1',
                borderColor: '#6366f1',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
              }}
            >
              Gửi câu trả lời
            </Button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary" style={{ fontSize: '14.5px' }}>Bạn cần </Text>
            <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, fontSize: '14.5px', fontWeight: 600, color: '#6366f1' }}>
              đăng nhập
            </Button>
            <Text type="secondary" style={{ fontSize: '14.5px' }}> để đóng góp câu trả lời cho câu hỏi này.</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuestionDetail;