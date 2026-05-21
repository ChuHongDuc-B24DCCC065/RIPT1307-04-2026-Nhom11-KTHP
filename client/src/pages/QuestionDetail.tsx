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
      // Cập nhật votes từ server trả về
      setQuestion(prev => prev ? { ...prev, votes: res.data.votes } : prev);
      setIsLiked(type === 'up' ? !isLiked : false);
      message.success(type === 'up' ? 'Bạn đã thích bài viết!' : 'Bạn đã không thích bài viết!');
    } catch {
      message.error('Không thể vote, vui lòng thử lại!');
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
      // Cập nhật votes của answer trong state
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
      fetchQuestion(); // Reload để cập nhật is_accepted
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
      fetchQuestion(); // Reload để hiện câu trả lời mới
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
  // --- Loading skeleton ---
  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Card><Skeleton active avatar paragraph={{ rows: 6 }} /></Card>
      </div>
    );
  }
  // --- Không tìm thấy câu hỏi ---
  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="Không tìm thấy câu hỏi này" />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
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
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>
      {/* ===== Card câu hỏi ===== */}
      <Card bordered={false} style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Row gutter={24}>
          {/* Cột vote */}
          <Col span={2} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Button
                icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                shape="circle"
                size="large"
                type={isLiked ? 'primary' : 'default'}
                onClick={() => handleVote('up')}
              />
              <Text strong style={{ fontSize: 20 }}>{question.votes}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Votes</Text>
              <Button
                icon={<DislikeOutlined />}
                shape="circle"
                size="large"
                onClick={() => handleVote('down')}
              />
            </div>
          </Col>
          {/* Cột nội dung */}
          <Col span={22}>
            <Title level={2}>{question.title}</Title>
            <Space split={<Divider type="vertical" />} style={{ marginBottom: 20 }} wrap>
              <Space><UserOutlined /> <Text strong>{question.author}</Text></Space>
              <Space><ClockCircleOutlined /> {formatTime(question.created_at)}</Space>
              <Space><MessageOutlined /> {question.answers?.length ?? 0} Trả lời</Space>
            </Space>
            <Paragraph style={{ fontSize: 16, lineHeight: '1.8', marginBottom: 24 }}>
              {question.description}
            </Paragraph>
            <div>
              {tagList.map(tag => (
                <Tag color="geekblue" key={tag} style={{ padding: '4px 12px', fontSize: 14 }}>
                  #{tag}
                </Tag>
              ))}
            </div>
          </Col>
        </Row>
      </Card>
      {/* ===== Danh sách câu trả lời ===== */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}><MessageOutlined /> {question.answers?.length ?? 0} Câu trả lời</Title>}
        bordered={false}
        style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {question.answers?.length === 0 ? (
          <Empty description="Chưa có câu trả lời nào. Hãy là người đầu tiên!" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={question.answers}
            renderItem={(answer) => (
              <List.Item
                key={answer.id}
                style={{
                  background: answer.is_accepted ? '#f6ffed' : 'transparent',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  border: answer.is_accepted ? '1px solid #b7eb8f' : '1px solid #f0f0f0'
                }}
              >
                <Row gutter={16}>
                  {/* Vote answer */}
                  <Col span={2} style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Button
                        icon={<LikeOutlined />}
                        size="small"
                        shape="circle"
                        onClick={() => handleVoteAnswer(answer.id, 'up')}
                      />
                      <Text strong>{answer.votes}</Text>
                      <Button
                        icon={<DislikeOutlined />}
                        size="small"
                        shape="circle"
                        onClick={() => handleVoteAnswer(answer.id, 'down')}
                      />
                      {/* Nút accept (chỉ tác giả câu hỏi) */}
                      {isOwner && (
                        <Button
                          icon={<CheckCircleFilled />}
                          size="small"
                          shape="circle"
                          type={answer.is_accepted ? 'primary' : 'default'}
                          style={{ color: answer.is_accepted ? '#52c41a' : undefined, marginTop: 4 }}
                          title="Chấp nhận câu trả lời này"
                          onClick={() => handleAcceptAnswer(answer.id)}
                        />
                      )}
                    </div>
                  </Col>
                  {/* Nội dung answer */}
                  <Col span={22}>
                    {answer.is_accepted === 1 && (
                      <Tag color="success" style={{ marginBottom: 8 }}>
                        <CheckCircleFilled /> Câu trả lời được chấp nhận
                      </Tag>
                    )}
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                      title={
                        <Space>
                          <Text strong>{answer.author || 'Ẩn danh'}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTime(answer.created_at)}
                          </Text>
                        </Space>
                      }
                      description={
                        <Paragraph style={{ fontSize: 15, color: '#333', marginTop: 8, marginBottom: 0 }}>
                          {answer.content}
                        </Paragraph>
                      }
                    />
                    {/* === Bình luận === */}
                    <div style={{ marginTop: 10, borderTop: '1px solid #f5f5f5', paddingTop: 8 }}>
                      {answer.comments?.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6, fontSize: 13, color: '#555' }}>
                          <UserOutlined style={{ color: '#bbb', marginTop: 2, flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 13 }}>{c.author}</Text>
                            <span style={{ margin: '0 6px', color: '#ccc' }}>|</span>
                            {c.content}
                          </span>
                          <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                            {formatTime(c.created_at)}
                          </Text>
                        </div>
                      ))}
                      {user ? (
                        showComment[answer.id] ? (
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            <Input
                              size="small"
                              placeholder="Nhập bình luận..."
                              value={commentTexts[answer.id] || ''}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [answer.id]: e.target.value }))}
                              onPressEnter={() => handlePostComment(answer.id)}
                            />
                            <Button size="small" type="primary"
                              loading={submittingComment === answer.id}
                              onClick={() => handlePostComment(answer.id)}
                            >Gửi</Button>
                            <Button size="small"
                              onClick={() => setShowComment(prev => ({ ...prev, [answer.id]: false }))}
                            >Hủy</Button>
                          </div>
                        ) : (
                          <Button type="link" size="small"
                            style={{ padding: 0, fontSize: 12, height: 'auto', color: '#888' }}
                            onClick={() => setShowComment(prev => ({ ...prev, [answer.id]: true }))}
                          >
                            + Thêm bình luận
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
      {/* ===== Form đăng câu trả lời ===== */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Viết câu trả lời của bạn</Title>}
        bordered={false}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {user ? (
          <>
            <TextArea
              rows={5}
              placeholder="Nhập câu trả lời của bạn ..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              style={{ marginBottom: 16, fontSize: 15 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePostAnswer}
              loading={submitting}
              size="large"
            >
              Gửi câu trả lời
            </Button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary">Bạn cần </Text>
            <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>
              đăng nhập
            </Button>
            <Text type="secondary"> để đăng câu trả lời.</Text>
          </div>
        )}
      </Card>
    </div>
  );
};
export default QuestionDetail;