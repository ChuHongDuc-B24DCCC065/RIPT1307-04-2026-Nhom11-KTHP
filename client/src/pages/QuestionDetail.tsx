import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card, Typography, Tag, Space, Button, Divider,
  Avatar, Input, message, Row, Col, Skeleton, Empty, Select, Tooltip, Alert, Modal, Switch, Form
} from 'antd';
import {
  CaretUpOutlined, CaretDownOutlined, CaretUpFilled, CaretDownFilled,
  MessageOutlined,
  SendOutlined, CheckCircleFilled,
  EyeOutlined, ShareAltOutlined, FlagOutlined,
  ThunderboltOutlined, InfoCircleOutlined,
  FireOutlined, PlusOutlined, CheckOutlined,
  SafetyCertificateOutlined, LockOutlined, UnlockOutlined,
  EyeInvisibleOutlined, FormOutlined, PaperClipOutlined
} from '@ant-design/icons';

import axiosInstance, { API_BASE_URL } from '../utils/axiosConfig';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getAvatarGradient } from '../utils/avatar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import BookmarkButton from '../components/BookmarkButton';

dayjs.extend(relativeTime);
dayjs.locale('vi');
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
  user_vote_type?: number;
  author_reputation?: number;
  author_role?: string;
  teacher_verified?: number;
  is_hidden?: number;
  teacher_note?: string;
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
  user_vote_type?: number;
  author_reputation?: number;
  status?: string;
  is_closed?: number;
  is_announcement?: number;
  author_role?: string;
  post_type?: string;
  deadline?: string;
  attachment_url?: string;
  attachment_name?: string;
}

// --- Helper: Format thời gian tương đối ---
const formatTime = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 0)     return 'Vừa xong';
  if (diff < 60)    return `${diff} giây trước`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

// --- Helper: Map dynamic user details based on username for premium feel ---
interface UserDetails {
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  points: number;
}
const getUserDetails = (username: string, actualPoints?: number): UserDetails => {
  const name = username ? username.trim() : '';
  const pts = actualPoints !== undefined ? actualPoints : 350;
  
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
    points: pts
  };
};

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');

  // --- Refs ---
  const answerEditorRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading]   = useState(true);
  const [answerText, setAnswerText]             = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [commentTexts, setCommentTexts]         = useState<Record<number, string>>({});
  const [showComment, setShowComment]           = useState<Record<number, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<number | null>(null);
  const [sortBy, setSortBy]                     = useState<'votes' | 'newest'>('votes');
  const [allQuestions, setAllQuestions]         = useState<Question[]>([]);
  const [teacherNoteText, setTeacherNoteText]   = useState<Record<number, string>>({});
  const [showTeacherNote, setShowTeacherNote]   = useState<Record<number, boolean>>({});
  const [followedAuthors, setFollowedAuthors]   = useState<Record<string, boolean>>({});
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportTempHide, setReportTempHide] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  // --- Lấy chi tiết câu hỏi từ API ---
  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/questions/${id}`);
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
      const res = await axiosInstance.get('/questions');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setAllQuestions(data);
    } catch (err) {
      console.error('Lỗi tải danh sách liên quan:', err);
    }
  };

  const fetchedIdRef = useRef<string | null>(null);

  const fetchTagCounts = async () => {
    try {
      const res = await axiosInstance.get('/questions/tags/stats');
      if (res.data?.success) {
        setTagCounts(res.data.data || {});
      }
    } catch (err) {
      console.error('Lỗi tải thống kê tag:', err);
    }
  };

  useEffect(() => {
    if (fetchedIdRef.current === id) return;
    fetchedIdRef.current = id || null;
    
    fetchQuestion();
    fetchAllQuestions();
    fetchTagCounts();
  }, [id]);

  // --- Vote câu hỏi ---
  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đánh giá câu hỏi!');
      navigate('/login');
      return;
    }
    try {
      const res = await axiosInstance.post(
        `/questions/${id}/vote`,
        { type }
      );
      setQuestion(prev => prev ? { ...prev, votes: res.data.votes, user_vote_type: res.data.user_vote_type } : prev);
      
      if (res.data.user_vote_type === 1) {
        message.success('Đã thích câu hỏi!');
      } else if (res.data.user_vote_type === -1) {
        message.success('Đã không thích câu hỏi!');
      } else {
        message.success('Đã bỏ đánh giá!');
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
      const res = await axiosInstance.post(
        `/questions/${id}/answers/${answerId}/vote`,
        { type }
      );
      setQuestion(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map(a =>
            a.id === answerId ? { ...a, votes: res.data.votes, user_vote_type: res.data.user_vote_type } : a
          )
        };
      });
      
      if (res.data.user_vote_type === 1) {
        message.success('Đã thích câu trả lời!');
      } else if (res.data.user_vote_type === -1) {
        message.success('Đã gửi phản hồi không hữu ích!');
      } else {
        message.success('Đã bỏ đánh giá câu trả lời!');
      }
    } catch {
      message.error('Không thể bình chọn câu trả lời!');
    }
  };

  // --- Chấp nhận câu trả lời (chỉ tác giả) ---
  const handleAcceptAnswer = async (answerId: number) => {
    // Optimistic UI update
    setQuestion(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: prev.answers.map(a => ({
          ...a,
          is_accepted: a.id === answerId ? 1 : 0
        }))
      };
    });

    try {
      await axiosInstance.patch(
        `/questions/${id}/answers/${answerId}/accept`,
        {}
      );
      message.success('Đã chấp nhận câu trả lời này làm giải pháp!');
      fetchQuestion();
    } catch {
      message.error('Không thể chấp nhận câu trả lời!');
      fetchQuestion(); // Revert state to actual DB value
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
      await axiosInstance.post(
        `/questions/${id}/answers`,
        { content: answerText.trim() }
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

  const handlePostComment = async (answerId: number) => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để bình luận!');
      return;
    }
    const text = commentTexts[answerId]?.trim();
    if (!text) return;
    setSubmittingComment(answerId);
    try {
      await axiosInstance.post(
        `/questions/${id}/answers/${answerId}/comments`,
        { content: text }
      );
      message.success('Đã gửi bình luận!');
      setCommentTexts(prev => ({ ...prev, [answerId]: '' }));
      setShowComment(prev => ({ ...prev, [answerId]: false }));
      fetchQuestion();
    } catch {
      message.error('Lỗi khi gửi bình luận!');
    } finally {
      setSubmittingComment(null);
    }
  };

  const fetchFollowStatus = async (authorName: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/users/${user.id}/following`);
      if (res.data.success) {
        const followingList = res.data.data || [];
        const isFollowing = followingList.some((u: any) => u.username.toLowerCase() === authorName.toLowerCase());
        setFollowedAuthors(prev => ({ ...prev, [authorName]: isFollowing }));
      }
    } catch (err) {
      console.error('Lỗi check follow status:', err);
    }
  };

  useEffect(() => {
    if (question) {
      fetchFollowStatus(question.author);
    }
  }, [question?.author]);

  // --- Theo dõi tác giả ---
  const handleFollowAuthor = async (authorId: number, authorName: string) => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để theo dõi tác giả!');
      navigate('/login');
      return;
    }
    if (authorId === user.id) {
      message.warning('Bạn không thể tự theo dõi chính mình!');
      return;
    }
    try {
      const res = await axiosInstance.post(
        `/users/${authorId}/follow`,
        {}
      );
      if (res.data.success) {
        const followed = res.data.followed;
        setFollowedAuthors(prev => ({ ...prev, [authorName]: followed }));
        message.success(followed ? `Bắt đầu theo dõi ${authorName}!` : `Đã hủy theo dõi ${authorName}`);
      }
    } catch (error) {
      console.error('Lỗi khi theo dõi:', error);
      message.error('Không thể thực hiện thao tác theo dõi!');
    }
  };

  // --- [TEACHER] Xác nhận chuyên môn ---
  const handleTeacherVerify = async (answerId: number) => {
    try {
      const res = await axiosInstance.patch(
        `/questions/${id}/answers/${answerId}/teacher-verify`,
        {}
      );
      message.success(res.data.message);
      fetchQuestion();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xác nhận chuyên môn!');
    }
  };

  // --- [TEACHER] Đóng/Mở luồng thảo luận ---
  const handleCloseThread = async () => {
    try {
      const res = await axiosInstance.patch(
        `/questions/${id}/close`,
        {}
      );
      message.success(res.data.message);
      fetchQuestion();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi khóa luồng thảo luận!');
    }
  };

  // --- [TEACHER] Ẩn câu trả lời sai lệch ---
  const handleHideAnswer = async (answerId: number) => {
    try {
      const res = await axiosInstance.patch(
        `/questions/${id}/answers/${answerId}/hide`,
        {}
      );
      message.success(res.data.message);
      fetchQuestion();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi ẩn câu trả lời!');
    }
  };

  // --- [TEACHER] Nhận xét nhanh ---
  const handleTeacherNote = async (answerId: number) => {
    const note = teacherNoteText[answerId]?.trim();
    if (!note) return;
    try {
      const res = await axiosInstance.post(
        `/questions/${id}/answers/${answerId}/teacher-note`,
        { note }
      );
      message.success(res.data.message);
      setTeacherNoteText(prev => ({ ...prev, [answerId]: '' }));
      setShowTeacherNote(prev => ({ ...prev, [answerId]: false }));
      fetchQuestion();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi gửi nhận xét!');
    }
  };

  // --- Chia sẻ câu hỏi ---
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Đã sao chép liên kết vào bộ nhớ tạm!');
  };

  // --- Gửi báo cáo vi phạm ---
  const handleSendReport = async () => {
    if (!reportReason.trim()) {
      message.error('Vui lòng chọn hoặc nhập lý do báo cáo!');
      return;
    }
    setReportSubmitting(true);
    try {
      const res = await axiosInstance.post(
        '/reports',
        {
          question_id: question?.id,
          ly_do: reportReason,
          temp_hide: reportTempHide
        }
      );
      if (res.data.success) {
        message.success(res.data.message);
        setReportModalVisible(false);
        setReportReason('');
        setReportTempHide(false);
        fetchQuestion();
        if (reportTempHide && isTeacher) {
          navigate('/');
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gửi báo cáo thất bại!');
    } finally {
      setReportSubmitting(false);
    }
  };

  // --- Cuộn tới khung trả lời ---
  const scrollToEditor = () => {
    if (answerEditorRef.current) {
      answerEditorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isOwner = user && question ? user.id === question.user_id : false;

  const getModifiedTime = () => {
    if (!question) return '';
    let latest = new Date(question.created_at).getTime();
    if (question.answers && question.answers.length > 0) {
      question.answers.forEach(ans => {
        const ansTime = new Date(ans.created_at).getTime();
        if (ansTime > latest) {
          latest = ansTime;
        }
        if (ans.comments && ans.comments.length > 0) {
          ans.comments.forEach(c => {
            const cTime = new Date(c.created_at).getTime();
            if (cTime > latest) {
              latest = cTime;
            }
          });
        }
      });
    }
    return dayjs(latest).fromNow();
  };

  const isTeacher = user?.role === 'teacher';
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const tagList = question && question.tags ? question.tags.split(',').map(t => t.trim()) : [];

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

  // Lọc các câu hỏi liên quan cùng chung thẻ tags
  const relatedQuestions = allQuestions
    .filter(q => q.id !== question.id)
    .filter(q => {
      const qTags = q.tags ? q.tags.split(',').map(t => t.trim().toLowerCase()) : [];
      return qTags.some(t => tagList.map(item => item.toLowerCase()).includes(t));
    })
    .slice(0, 4);

  // Sắp xếp các câu trả lời (ưu tiên: accepted > teacher_verified > giảng viên > votes)
  const sortedAnswers = question.answers ? [...question.answers].sort((a, b) => {
    const aAccepted = a.is_accepted === 1;
    const bAccepted = b.is_accepted === 1;
    
    // Câu trả lời được tác giả chấp nhận luôn đưa lên đầu
    if (aAccepted !== bAccepted) {
      return bAccepted ? 1 : -1;
    }
    // Câu trả lời được giảng viên xác nhận ưu tiên tiếp theo
    const aVerified = a.teacher_verified === 1;
    const bVerified = b.teacher_verified === 1;
    if (aVerified !== bVerified) {
      return bVerified ? 1 : -1;
    }
    // Câu trả lời của giảng viên ưu tiên tiếp
    const aIsTeacher = a.author_role === 'teacher';
    const bIsTeacher = b.author_role === 'teacher';
    if (aIsTeacher !== bIsTeacher) {
      return bIsTeacher ? 1 : -1;
    }
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  }) : [];

  const authorDetails = getUserDetails(question.author, question.author_reputation);
  const isLiked = question?.user_vote_type === 1;
  const isDisliked = question?.user_vote_type === -1;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px 40px 8px', paddingTop: '20px' }}>
      <Row gutter={[24, 24]}>
        
        {/* ======================================================== */}
        {/* CỘT CHÍNH TRÁI (NỘI DUNG CHI TIẾT & CÂU TRẢ LỜI) - 70%   */}
        {/* ======================================================== */}
        <Col xs={24} lg={17}>

          {question.status === 'pending' && (
            <Alert
              title="Bài viết đang chờ phê duyệt"
              description="Bài viết này đang chờ Admin phê duyệt để hiển thị công khai. Chỉ bạn và Admin mới có thể nhìn thấy."
              type="warning"
              showIcon
              style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #fde047' }}
            />
          )}

          {/* ===== Card Chi Tiết Câu Hỏi ===== */}
          <Card 
            variant="borderless" 
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
                  <Tooltip title="Bình chọn lên">
                    <Button
                      icon={isLiked ? <CaretUpFilled style={{ fontSize: 24 }} /> : <CaretUpOutlined style={{ fontSize: 24 }} />}
                      shape="circle"
                      size="middle"
                      className={`transition-all ${isLiked ? 'vote-btn-active' : ''}`}
                      style={{ 
                        border: 'none', 
                        background: 'transparent',
                        color: isLiked ? '#6366f1' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => handleVote('up')}
                    />
                  </Tooltip>
                  <Text strong style={{ fontSize: 18, color: '#1e293b', margin: '2px 0' }}>{question.votes}</Text>
                  <Tooltip title="Bình chọn xuống">
                    <Button
                      icon={isDisliked ? <CaretDownFilled style={{ fontSize: 24 }} /> : <CaretDownOutlined style={{ fontSize: 24 }} />}
                      shape="circle"
                      size="middle"
                      className={`transition-all ${isDisliked ? 'vote-btn-active' : ''}`}
                      style={{ 
                        border: 'none', 
                        background: 'transparent',
                        color: isDisliked ? '#ef4444' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '14px 0 20px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, alignItems: 'center', fontSize: 13, color: '#64748b' }}>
                  <span>Ngày đăng: <span style={{ color: '#334155' }}>{dayjs(question.created_at).fromNow()}</span></span>
                  <span>Ngày Modified: <span style={{ color: '#334155' }}>{getModifiedTime()}</span></span>
                  <span>Số view: <span style={{ color: '#334155' }}>{question.views ?? 0}</span></span>
                  {question.is_closed === 1 && (
                    <Tag color="red" style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, padding: '0 8px', margin: 0, marginLeft: 'auto' }}><LockOutlined /> Đã khóa</Tag>
                  )}
                </div>

                {/* Các nhãn thông tin đặc biệt của Giảng viên */}
                {question.post_type === 'assignment' && (
                  <Alert
                    title={<Text strong style={{ fontSize: '15px', color: '#b91c1c' }}>📝 Bài tập môn học / Câu hỏi ôn tập có hạn nộp</Text>}
                    description={
                      <div style={{ marginTop: '4px' }}>
                        <Text style={{ fontSize: '13.5px' }}>
                          <b>Hạn chót: </b> 
                          <span style={{ color: dayjs().isAfter(dayjs(question.deadline)) ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                            {dayjs(question.deadline).format('HH:mm [ngày] DD/MM/YYYY')} 
                            ({dayjs().isAfter(dayjs(question.deadline)) ? 'Đã hết hạn nộp bài' : `Còn lại: ${dayjs(question.deadline).fromNow(true)}`})
                          </span>
                        </Text>
                      </div>
                    }
                    type={dayjs().isAfter(dayjs(question.deadline)) ? "error" : "warning"}
                    showIcon
                    style={{ marginBottom: 20, borderRadius: 12 }}
                  />
                )}

                {question.post_type === 'material' && (
                  <Alert
                    title={<Text strong style={{ fontSize: '15px', color: '#1e3a8a' }}>📚 Tài liệu học tập / Bài giảng chuyên ngành</Text>}
                    description={<Text style={{ fontSize: '13.5px' }}>Tài liệu tham khảo chính thức được chia sẻ bởi Giảng viên.</Text>}
                    type="info"
                    showIcon
                    style={{ marginBottom: 20, borderRadius: 12 }}
                  />
                )}

                {/* Nội dung chi tiết */}
                <div 
                  className="premium-description ql-editor custom-quill-content" 
                  style={{ fontSize: 15.5, lineHeight: '1.8', color: '#334155', marginBottom: 28 }}
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />

                {/* Tài liệu đính kèm nếu có */}
                {question.attachment_url && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                  }}>
                    <Space size="middle">
                      <div style={{
                        background: '#e0e7ff',
                        color: '#4f46e5',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <PaperClipOutlined style={{ fontSize: '18px' }} />
                      </div>
                      <div>
                        <Text strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>
                          Tài liệu học tập / File đính kèm
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12.5px', color: '#64748b' }}>
                          {question.attachment_name || 'Tài liệu học tập'}
                        </Text>
                      </div>
                    </Space>
                    <Button 
                      type="link" 
                      href={`${API_BASE_URL.replace('/api', '')}${question.attachment_url}`}
                      target="_blank"
                      download
                      style={{ 
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        border: 'none',
                        fontWeight: 600
                      }}
                    >
                      Tải xuống
                    </Button>
                  </div>
                )}

                {/* Thẻ tags & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tagList.map(tag => {
                      const count = tagCounts[tag.toLowerCase()] || 0;
                      return (
                        <Tooltip key={tag} title={`Có ${count} câu hỏi gắn thẻ này`}>
                          <Tag 
                            color="purple" 
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
                            onClick={() => navigate(`/search?tag=${tag.toLowerCase()}`)}
                          >
                            #{tag}
                          </Tag>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* Actions buttons */}
                  <Space size="middle" wrap>
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
                      onClick={() => {
                        if (!user) {
                          message.warning('Vui lòng đăng nhập để thực hiện báo cáo!');
                          navigate('/login');
                          return;
                        }
                        setReportModalVisible(true);
                      }}
                    >
                      Báo cáo
                    </Button>
                    {/* Nút khóa/mở luồng thảo luận (chỉ teacher/admin) */}
                    {isTeacherOrAdmin && (
                      <Button 
                        type="text" 
                        icon={question.is_closed ? <UnlockOutlined /> : <LockOutlined />}
                        style={{ color: question.is_closed ? '#10b981' : '#ef4444', fontWeight: 500, borderRadius: 8 }}
                        onClick={handleCloseThread}
                      >
                        {question.is_closed ? 'Mở khóa thảo luận' : 'Khóa thảo luận'}
                      </Button>
                    )}
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>

          {/* ===== Viết Câu Trả Lời Mới ===== */}
          <div ref={answerEditorRef}>
            {question.is_closed === 1 ? (
              <Alert
                title="Luồng thảo luận đã bị khóa"
                description="Giảng viên đã khóa luồng thảo luận này. Không thể viết thêm câu trả lời hoặc bình luận mới."
                type="info"
                showIcon
                icon={<LockOutlined />}
                style={{ marginBottom: 28, borderRadius: 16, border: '1px solid #bfdbfe', background: '#eff6ff' }}
              />
            ) : (
            <Card
              title={
                <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ThunderboltOutlined style={{ color: '#eab308' }} />
                  Đóng góp câu trả lời của bạn
                </Title>
              }
              variant="borderless"
              className="premium-card animated-hover-card"
              style={{ 
                borderRadius: '24px', 
                padding: '12px 16px 20px 16px',
                marginBottom: 28
              }}
            >
              {user ? (
                <>
                  <TextArea
                    rows={5}
                    placeholder="Nhập câu trả lời chi tiết, mã nguồn minh họa và giải pháp đầy đủ để giúp đỡ cộng đồng..."
                    value={answerText}
                    onChange={(e: any) => setAnswerText(e.target.value)}
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
            )}
          </div>

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
            </Card>
          ) : (
            sortedAnswers.map((answer) => {
                const isAccepted = answer.is_accepted === 1;
                const isVerified = answer.teacher_verified === 1;
                const isHidden = answer.is_hidden === 1;
                const isAnswerByTeacher = answer.author_role === 'teacher';
                const answerAuthorDetails = getUserDetails(answer.author, answer.author_reputation);
                return (
                  <Card
                    key={answer.id}
                    variant="borderless"
                    className={`premium-card animated-hover-card ${isAccepted ? 'glow-accepted' : ''}`}
                    style={{
                      borderRadius: '20px',
                      padding: '8px 12px',
                      marginBottom: 20,
                      border: isAccepted ? '2px solid #bbf7d0' : isAnswerByTeacher ? '2px solid #bfdbfe' : isHidden ? '2px dashed #fca5a5' : 'none',
                      backgroundColor: isAccepted ? '#f0fdf4' : isAnswerByTeacher ? '#f0f9ff' : isHidden ? '#fef2f2' : '#ffffff',
                      boxShadow: isAccepted ? '0 10px 15px -3px rgba(34, 197, 94, 0.05)' : 'none',
                      opacity: isHidden ? 0.7 : 1
                    }}
                  >
                    {/* Label bị ẩn (chỉ teacher/admin thấy) */}
                    {isHidden && (
                      <div style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 14px', borderRadius: '8px', fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EyeInvisibleOutlined /> Câu trả lời này đã bị ẩn bởi Giảng viên do chứa thông tin không chính xác
                      </div>
                    )}
                    <Row gutter={16} wrap={false}>
                      {/* Cột vote câu trả lời */}
                      <Col style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, flexShrink: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <Tooltip title="Bình chọn lên">
                            <Button
                              icon={answer.user_vote_type === 1 ? <CaretUpFilled style={{ fontSize: 20 }} /> : <CaretUpOutlined style={{ fontSize: 20 }} />}
                              size="small"
                              shape="circle"
                              style={{ 
                                backgroundColor: answer.user_vote_type === 1 ? '#e6f7ff' : '#f1f5f9', 
                                border: 'none', 
                                color: answer.user_vote_type === 1 ? '#6366f1' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={() => handleVoteAnswer(answer.id, 'up')}
                            />
                          </Tooltip>
                          <Text strong style={{ color: '#1e293b', fontSize: 15 }}>{answer.votes}</Text>
                          <Tooltip title="Bình chọn xuống">
                            <Button
                              icon={answer.user_vote_type === -1 ? <CaretDownFilled style={{ fontSize: 20 }} /> : <CaretDownOutlined style={{ fontSize: 20 }} />}
                              size="small"
                              shape="circle"
                              style={{ 
                                backgroundColor: answer.user_vote_type === -1 ? '#fee2e2' : '#f1f5f9', 
                                border: 'none', 
                                color: answer.user_vote_type === -1 ? '#ef4444' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={() => handleVoteAnswer(answer.id, 'down')}
                            />
                          </Tooltip>
                          
                          {/* Nút chấp nhận câu trả lời (chỉ tác giả câu hỏi) */}
                          {isOwner ? (
                            <Tooltip title={isAccepted ? 'Hủy đánh dấu câu trả lời đúng nhất' : 'Đánh dấu câu trả lời đúng nhất'}>
                              <Button
                                icon={<CheckOutlined />}
                                size="small"
                                shape="circle"
                                type={isAccepted ? 'primary' : 'default'}
                                style={{ 
                                  color: isAccepted ? '#ffffff' : '#cbd5e1', 
                                  backgroundColor: isAccepted ? '#22c55e' : 'transparent',
                                  marginTop: 12,
                                  borderColor: isAccepted ? '#22c55e' : '#e2e8f0',
                                  boxShadow: isAccepted ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
                                }}
                                onClick={() => handleAcceptAnswer(answer.id)}
                              />
                            </Tooltip>
                          ) : (
                            isAccepted && (
                              <Tooltip title="Giải pháp được chấp nhận">
                                <CheckCircleFilled style={{ color: '#22c55e', fontSize: '20px', marginTop: 12 }} />
                              </Tooltip>
                            )
                          )}
                        </div>
                      </Col>
                      
                      {/* Nội dung câu trả lời */}
                      <Col flex="auto" style={{ paddingLeft: 12 }}>
                        {/* Badges: Accepted, Verified, Teacher */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: (isAccepted || isVerified || isAnswerByTeacher) ? 12 : 0 }}>
                          {isAccepted && (
                            <Tag color="success" style={{ padding: '4px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px' }}>
                              <CheckCircleFilled style={{ marginRight: 6 }} />
                              Câu trả lời hay nhất
                            </Tag>
                          )}
                          {isVerified && (
                            <Tag color="cyan" style={{ padding: '4px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px' }}>
                              <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                              Giảng viên xác nhận
                            </Tag>
                          )}
                          {isAnswerByTeacher && (
                            <Tag color="blue" style={{ padding: '4px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px' }}>
                              👨‍🏫 Giảng viên
                            </Tag>
                          )}
                        </div>
                        
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text strong style={{ color: '#1e293b', fontSize: '14.5px' }}>{answer.author || 'Ẩn danh'}</Text>
                                <Tag bordered={false} style={{ color: answerAuthorDetails.badgeColor, backgroundColor: answerAuthorDetails.badgeBg, fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '0 6px' }}>
                                  {answerAuthorDetails.badge}
                                </Tag>
                                {isAnswerByTeacher && (
                                  <Tag color="blue" bordered={false} style={{ fontSize: 10, fontWeight: 600, borderRadius: 4, padding: '0 6px', margin: 0 }}>👨‍🏫 GV</Tag>
                                )}
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
                        <Paragraph style={{ fontSize: 15, color: '#334155', marginTop: 10, marginBottom: 12, lineHeight: '1.75' }}>
                          {answer.content}
                        </Paragraph>

                        {/* Nhận xét từ giảng viên (hiển thị cho tất cả user) */}
                        {answer.teacher_note && (
                          <div style={{
                            background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                            border: '1px solid #bfdbfe',
                            borderLeft: '4px solid #3b82f6',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: 14,
                            fontSize: 13,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <SafetyCertificateOutlined style={{ color: '#3b82f6', fontSize: 13 }} />
                              <Text strong style={{ color: '#1d4ed8', fontSize: 12 }}>Nhận xét từ Giảng viên</Text>
                            </div>
                            <Text italic style={{ color: '#334155', fontSize: 13 }}>{answer.teacher_note}</Text>
                          </div>
                        )}

                        {/* Thanh hành động giảng viên (chỉ hiện cho teacher/admin) */}
                        {isTeacherOrAdmin && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            {isTeacher && (
                              <Tooltip title={isVerified ? 'Bỏ xác nhận chuyên môn' : 'Xác nhận chuyên môn'}>
                                <Button
                                  size="small"
                                  type={isVerified ? 'primary' : 'default'}
                                  icon={<SafetyCertificateOutlined />}
                                  style={{
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    ...(isVerified ? { background: '#0891b2', borderColor: '#0891b2' } : {})
                                  }}
                                  onClick={() => handleTeacherVerify(answer.id)}
                                >
                                  {isVerified ? 'Đã xác nhận' : 'Xác nhận'}
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip title={isHidden ? 'Hiện lại câu trả lời' : 'Ẩn câu trả lời sai lệch'}>
                              <Button
                                size="small"
                                danger={!isHidden}
                                type={isHidden ? 'primary' : 'default'}
                                icon={isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
                                onClick={() => handleHideAnswer(answer.id)}
                              >
                                {isHidden ? 'Hiện lại' : 'Ẩn'}
                              </Button>
                            </Tooltip>
                            {isTeacher && (
                              <Button
                                size="small"
                                icon={<FormOutlined />}
                                style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
                                onClick={() => {
                                  setShowTeacherNote(prev => ({ ...prev, [answer.id]: !prev[answer.id] }));
                                  if (answer.teacher_note) {
                                    setTeacherNoteText(prev => ({ ...prev, [answer.id]: answer.teacher_note || '' }));
                                  }
                                }}
                              >
                                Nhận xét
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Ô nhập nhận xét nhanh (chỉ teacher) */}
                        {showTeacherNote[answer.id] && isTeacher && (
                          <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                            <Input.TextArea
                              rows={2}
                              placeholder='VD: "Lỗi logic ở dòng 5", "Sai cú pháp hàm map"...'
                              value={teacherNoteText[answer.id] || ''}
                              onChange={e => setTeacherNoteText(prev => ({ ...prev, [answer.id]: e.target.value }))}
                              style={{ borderRadius: 10, fontSize: 13 }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <Button
                                type="primary"
                                size="small"
                                style={{ borderRadius: 8, background: '#3b82f6', borderColor: '#3b82f6' }}
                                onClick={() => handleTeacherNote(answer.id)}
                              >
                                Lưu
                              </Button>
                              <Button
                                size="small"
                                style={{ borderRadius: 8 }}
                                onClick={() => setShowTeacherNote(prev => ({ ...prev, [answer.id]: false }))}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        )}
                        
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
                          
                          {/* Nút / Thanh bình luận (ẩn nếu luồng bị khóa) */}
                          {user && !question.is_closed ? (
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
              })
          )}
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
            variant="borderless"
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
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>THẺ</Text>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 4 }}>
                  {tagList.length > 0 ? (
                    tagList.map(tag => (
                      <Tag 
                        key={tag}
                        color="purple" 
                        style={{ 
                          margin: 0,
                          borderRadius: '6px', 
                          padding: '2px 8px', 
                          fontSize: '11px',
                          fontWeight: 500,
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/search?tag=${tag.toLowerCase()}`)}
                      >
                        #{tag}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>Không có thẻ</Text>
                  )}
                </div>
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
            variant="borderless"
            className="premium-card animated-hover-card"
            style={{ borderRadius: '20px', marginBottom: 20, padding: '6px' }}
          >
            <div 
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
              onClick={() => navigate(`/profile?id=${question.user_id}`)}
              title="Xem trang cá nhân"
            >
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
                  {question.author_role === 'teacher' && (
                    <Tag color="blue" style={{ fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '0 5px', margin: 0 }}>👨‍🏫 Giảng viên</Tag>
                  )}
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {authorDetails.title}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>★ {authorDetails.points}đ uy tín</Text>
                </div>
              </div>
            </div>
            
            {!isOwner && (
              <>
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
                  onClick={() => handleFollowAuthor(question.user_id, question.author)}
                >
                  {followedAuthors[question.author] ? 'Đang theo dõi ✓' : 'Theo dõi tác giả'}
                </Button>
              </>
            )}
          </Card>

          {/* WIDGET 3: CÂU HỎI LIÊN QUAN */}
          {relatedQuestions.length > 0 && (
            <Card
              title={
                <div style={{ fontSize: 14, fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>
                  CÂU HỎI LIÊN QUAN
                </div>
              }
              variant="borderless"
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
            variant="borderless"
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

      {/* Report Modal */}
      <Modal
        title={<span>⚠️ Báo cáo vi phạm nội dung</span>}
        open={reportModalVisible}
        onCancel={() => {
          setReportModalVisible(false);
          setReportReason('');
          setReportTempHide(false);
        }}
        onOk={handleSendReport}
        confirmLoading={reportSubmitting}
        okText="Gửi báo cáo"
        cancelText="Hủy"
        okButtonProps={{ style: { borderRadius: '8px' } }}
        cancelButtonProps={{ style: { borderRadius: '8px' } }}
      >
        <Form layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item label="Lý do báo cáo" required>
            <Select 
              placeholder="Chọn lý do vi phạm" 
              onChange={(val) => setReportReason(val)}
              value={reportReason || undefined}
            >
              <Select.Option value="Kiến thức sai nghiêm trọng">Kiến thức sai nghiêm trọng / Sai lệch trầm trọng</Select.Option>
              <Select.Option value="Vi phạm quy chế thi">Vi phạm quy chế thi cử / Học tập</Select.Option>
              <Select.Option value="Ngôn từ không phù hợp">Ngôn từ không phù hợp / Thô tục</Select.Option>
              <Select.Option value="Spam / Quảng cáo trái phép">Spam / Quảng cáo trái phép</Select.Option>
              <Select.Option value="Lý do khác">Lý do khác</Select.Option>
            </Select>
          </Form.Item>
          {reportReason === 'Lý do khác' && (
            <Form.Item label="Chi tiết lý do khác" required>
              <TextArea
                rows={3}
                placeholder="Nhập lý do chi tiết..."
                onChange={(e) => setReportReason(e.target.value)}
              />
            </Form.Item>
          )}
          {isTeacher && (
            <Form.Item style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Switch
                  checked={reportTempHide}
                  onChange={(checked) => setReportTempHide(checked)}
                />
                <span style={{ fontWeight: 600, color: '#ef4444' }}>
                  Ẩn tạm thời bài viết này ngay lập tức (Chờ Admin duyệt)
                </span>
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionDetail;