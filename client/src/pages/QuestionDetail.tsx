import React, { useState } from 'react';
import { 
  ConfigProvider, Typography, Tag, Button, Input, Form, 
  List, Avatar, Divider, Space, Dropdown, Flex, Tooltip, message, Row, Col, Card
} from 'antd';
import { 
  CaretUpOutlined, CaretDownOutlined, ShareAltOutlined, FlagOutlined,
  ClockCircleOutlined, EyeOutlined, MessageOutlined,
  EditOutlined, DeleteOutlined, UserOutlined, MoreOutlined, CheckCircleFilled
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// --- Mock Data ---
const MOCK_QUESTION = {
  id: 1,
  user_id: 1, 
  title: "Lỗi 'Hydration failed' trong React 19 khi dùng Next.js, làm sao để fix?",
  author: "Nguyen Van A",
  createdAt: "2 giờ trước",
  views: 1250,
  commentCount: 3,
  votes: 128,
  tags: ["ReactJS", "Frontend", "TypeScript", "Web Performance"],
  content: `Chào mọi người,
  
Hiện tại mình đang nâng cấp dự án từ React 18 lên React 19 và gặp phải lỗi Hydration mismatch. Mình không rõ tại sao lỗi này lại xuất hiện vì ở version trước chạy rất bình thường.
  
Dưới đây là đoạn code component của mình:`,
  codeSnippet: `export default function Header() {
  return (
    <header>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </header>
  );
}`
};

const MOCK_COMMENTS = [
  {
    id: 1,
    author: "Tran B",
    createdAt: "1 giờ trước",
    votes: 45,
    isAccepted: false,
    content: "Lỗi này xảy ra do giá trị sinh ra ở server (SSR) khác với client. Bạn đang dùng `new Date()` render trực tiếp nên bị lệch giờ. Cách xử lý là dùng `useEffect` để set state ở client nhé.",
    replies: [
      { id: 101, author: "Nguyen Van A", createdAt: "45 phút trước", content: "Cảm ơn bạn, mình đã thử và thành công!" }
    ]
  },
  {
    id: 2,
    author: "Le C",
    createdAt: "45 phút trước",
    votes: 12,
    isAccepted: true,
    content: "Chuẩn rồi, trong React 19 lỗi hydration báo chi tiết hơn. Bạn có thể bọc component đó bằng <ClientOnly> hoặc dùng dynamic import vô hiệu hóa SSR cho component đó cũng được.",
    replies: []
  },
  {
    id: 3,
    author: "Pham D",
    createdAt: "10 phút trước",
    votes: -2,
    isAccepted: false,
    content: "Bạn thử xóa thư mục node_modules rồi npm install lại xem sao? Mình hay làm vậy khi bị lỗi ảo.",
    replies: []
  }
];

const MOCK_RELATED_QUESTIONS = [
  { id: 101, title: "Cách xử lý lỗi Hydration trong Next.js 14?", views: 342 },
  { id: 102, title: "React 19 có gì mới so với React 18?", views: 1205 },
  { id: 103, title: "Tại sao useEffect lại chạy 2 lần trong Strict Mode?", views: 854 },
  { id: 104, title: "Làm sao để tối ưu bundle size khi dùng Ant Design?", views: 432 },
  { id: 105, title: "Server components vs Client components", views: 920 },
];

const QuestionDetail: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthor = user ? user.id === MOCK_QUESTION.user_id : true; 

  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [sortType, setSortType] = useState("newest");
  
  // Trạng thái lưu ID của comment đang được reply
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) {
      message.warning('Vui lòng nhập nội dung bình luận!');
      return;
    }
    const comment = {
      id: Date.now(), 
      author: user?.username || user?.name || "Bạn", 
      createdAt: "Vừa xong",
      votes: 0,
      isAccepted: false,
      content: newComment,
      replies: []
    };
    setComments([comment, ...comments]);
    setNewComment("");
    message.success('Đã gửi bình luận thành công!');
  };

  const handleAddReply = (parentId: number) => {
    if (!replyText.trim()) return;
    const reply = {
      id: Date.now(),
      author: user?.username || user?.name || "Bạn",
      createdAt: "Vừa xong",
      content: replyText,
    };
    setComments(comments.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      return c;
    }));
    setReplyingTo(null);
    setReplyText("");
    message.success("Đã gửi phản hồi!");
  };

  const handleVoteComment = (id: number, type: 'up' | 'down') => {
    setComments(comments.map(c => {
      if (c.id === id) {
        const userVote = (c as any).userVote;
        if (userVote === type) {
          return { ...c, votes: type === 'up' ? c.votes - 1 : c.votes + 1, userVote: null };
        } else if (userVote) {
          return { ...c, votes: type === 'up' ? c.votes + 2 : c.votes - 2, userVote: type };
        } else {
          return { ...c, votes: type === 'up' ? c.votes + 1 : c.votes - 1, userVote: type };
        }
      }
      return c;
    }));
  };

  const handleAcceptComment = (id: number) => {
    setComments(comments.map(c => ({
      ...c,
      isAccepted: c.id === id ? !c.isAccepted : false // Hủy các check cũ, chỉ cho 1 tick
    })));
  };

  const sortedComments = [...comments].sort((a, b) => {
    // Luôn ưu tiên câu trả lời hay nhất lên đầu
    if (a.isAccepted && !b.isAccepted) return -1;
    if (!a.isAccepted && b.isAccepted) return 1;

    if (sortType === 'newest') return b.id - a.id; 
    if (sortType === 'oldest') return a.id - b.id;
    if (sortType === 'most_voted') return b.votes - a.votes;
    if (sortType === 'least_voted') return a.votes - b.votes;
    return 0;
  });

  const sortLabels: Record<string, string> = {
    newest: 'Mới nhất',
    oldest: 'Cũ nhất',
    most_voted: 'Vote cao nhất',
    least_voted: 'Vote thấp nhất'
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
        },
        components: {
          Tag: {
            defaultBg: '#e0e7ff',
            defaultColor: '#6366f1',
          }
        }
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <Row gutter={32}>
          
          {/* ========== CỘT TRÁI (Nội dung chính) ========== */}
          <Col xs={24} lg={18}>
            
            {/* 1. KHỐI NỘI DUNG CÂU HỎI CHÍNH */}
            <Flex gap="large" align="flex-start" style={{ marginBottom: 40 }}>
              <Flex vertical align="center" gap="small" style={{ minWidth: 50, marginTop: 12 }}>
                <Button type="text" shape="circle" icon={<CaretUpOutlined style={{ fontSize: 24, color: '#64748b' }} />} />
                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>{MOCK_QUESTION.votes}</Title>
                <Button type="text" shape="circle" icon={<CaretDownOutlined style={{ fontSize: 24, color: '#64748b' }} />} />
                <Divider style={{ margin: '8px 0', borderColor: '#e2e8f0' }} />
                <Tooltip title="Chia sẻ"><Button type="text" shape="circle" icon={<ShareAltOutlined style={{ fontSize: 18, color: '#64748b' }} />} /></Tooltip>
                <Tooltip title="Báo cáo"><Button type="text" shape="circle" icon={<FlagOutlined style={{ fontSize: 18, color: '#64748b' }} />} /></Tooltip>
              </Flex>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Title level={1} style={{ marginTop: 0, fontWeight: 700, fontSize: 32, lineHeight: 1.3 }}>
                  {MOCK_QUESTION.title}
                </Title>
                
                <Space split={<Divider type="vertical" />} style={{ color: '#64748b', marginBottom: 20 }} wrap>
                  <Space><ClockCircleOutlined /> <span>{MOCK_QUESTION.createdAt}</span></Space>
                  <Space><EyeOutlined /> <span>{MOCK_QUESTION.views} lượt xem</span></Space>
                  <Space><MessageOutlined /> <span>{MOCK_QUESTION.commentCount} bình luận</span></Space>
                </Space>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 24 }}>
                  {MOCK_QUESTION.tags.map(tag => (
                    <Tag key={tag} color="#e0e7ff" style={{ color: '#6366f1', borderRadius: 6, padding: '4px 12px', fontSize: 14, border: 'none', fontWeight: 500 }}>
                      {tag}
                    </Tag>
                  ))}
                </div>

                <div style={{ fontSize: 16, lineHeight: 1.8, color: '#334155', marginBottom: 24 }}>
                  {MOCK_QUESTION.content.split('\n').map((line, idx) => (
                    <Paragraph key={idx} style={{ fontSize: 16, marginBottom: 8 }}>{line}</Paragraph>
                  ))}
                  <pre style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #e2e8f0', marginTop: 16 }}>
                    <code style={{ fontFamily: 'Consolas, monospace', fontSize: 14, color: '#1e293b' }}>
                      {MOCK_QUESTION.codeSnippet}
                    </code>
                  </pre>
                </div>

                {isAuthor && (
                  <Flex justify="flex-end" gap="small">
                    <Button type="text" icon={<EditOutlined />} style={{ color: '#64748b', fontWeight: 500 }}>Sửa bài viết</Button>
                    <Button type="text" icon={<DeleteOutlined />} style={{ color: '#ef4444', opacity: 0.8, fontWeight: 500 }}>Xóa bài viết</Button>
                  </Flex>
                )}
              </div>
            </Flex>

            {/* 2. KHỐI NHẬP CÂU TRẢ LỜI */}
            <div style={{ marginBottom: 40 }}>
              <Title level={4} style={{ fontWeight: 700, marginBottom: 16 }}>Câu trả lời của bạn</Title>
              <Form layout="vertical">
                <Form.Item>
                  <Input.TextArea 
                    rows={5} 
                    placeholder="Chia sẻ giải pháp hoặc ý kiến của bạn tại đây..." 
                    style={{ fontSize: 16, padding: 16, borderRadius: 8 }}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </Form.Item>
                <Flex justify="flex-end">
                  <Button type="primary" size="large" onClick={handleAddComment} style={{ fontWeight: 600, borderRadius: 8, padding: '0 24px' }}>
                    Gửi bình luận
                  </Button>
                </Flex>
              </Form>
            </div>

            {/* 3. KHỐI DANH SÁCH CÁC BÌNH LUẬN */}
            <div>
              <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                  {comments.length} Bình luận
                </Title>
                <Dropdown 
                  menu={{ 
                    items: [
                      { key: 'newest', label: 'Mới nhất' }, 
                      { key: 'oldest', label: 'Cũ nhất' }, 
                      { key: 'most_voted', label: 'Vote cao nhất' },
                      { key: 'least_voted', label: 'Vote thấp nhất' }
                    ],
                    onClick: (e) => setSortType(e.key)
                  }}
                >
                  <a onClick={(e) => e.preventDefault()} style={{ color: '#64748b', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
                    Sắp xếp theo: <Text strong style={{ color: '#1e293b', marginLeft: 4 }}>{sortLabels[sortType]}</Text>
                  </a>
                </Dropdown>
              </Flex>
              
              <List
                itemLayout="vertical"
                dataSource={sortedComments}
                renderItem={(comment) => (
                  <List.Item style={{ 
                    padding: '20px 24px', 
                    background: comment.isAccepted ? '#f0fdf4' : 'transparent',
                    border: comment.isAccepted ? '1px solid #bbf7d0' : '1px solid transparent',
                    borderBottom: !comment.isAccepted ? '1px solid #e2e8f0' : '1px solid #bbf7d0',
                    borderRadius: comment.isAccepted ? 16 : 0,
                    marginBottom: comment.isAccepted ? 20 : 0
                  }}>
                    <Flex gap="middle" align="flex-start">
                      <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#c7d2fe', color: '#4f46e5' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
                          <div>
                            <Space direction="vertical" size={2}>
                              <Text strong style={{ fontSize: 16 }}>{comment.author}</Text>
                              <Text type="secondary" style={{ fontSize: 13 }}>{comment.createdAt}</Text>
                            </Space>
                            {comment.isAccepted && (
                              <div style={{ marginTop: 8 }}>
                                <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>
                                  Câu trả lời hay nhất
                                </Tag>
                              </div>
                            )}
                          </div>
                          
                          <Flex align="center" gap="middle">
                            {/* Nút tick cho author */}
                            {isAuthor && (
                              <Tooltip title={comment.isAccepted ? "Bỏ chọn" : "Chọn câu trả lời hay nhất"}>
                                <Button 
                                  type="text" 
                                  shape="circle" 
                                  icon={<CheckCircleFilled style={{ color: comment.isAccepted ? '#22c55e' : '#cbd5e1', fontSize: 24 }} />} 
                                  onClick={() => handleAcceptComment(comment.id)}
                                />
                              </Tooltip>
                            )}

                            {/* Khối vote comment */}
                            <Flex align="center" gap="small" style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                              <Button 
                                type="text" shape="circle" size="small" 
                                icon={<CaretUpOutlined style={{ color: (comment as any).userVote === 'up' ? '#4f46e5' : '#64748b' }} />} 
                                onClick={() => handleVoteComment(comment.id, 'up')}
                                style={{ background: (comment as any).userVote === 'up' ? '#e0e7ff' : 'transparent' }}
                              />
                              <Text strong style={{ fontSize: 14, color: (comment as any).userVote ? '#4f46e5' : 'inherit' }}>{comment.votes}</Text>
                              <Button 
                                type="text" shape="circle" size="small" 
                                icon={<CaretDownOutlined style={{ color: (comment as any).userVote === 'down' ? '#ef4444' : '#64748b' }} />} 
                                onClick={() => handleVoteComment(comment.id, 'down')}
                                style={{ background: (comment as any).userVote === 'down' ? '#fee2e2' : 'transparent' }}
                              />
                            </Flex>
                          </Flex>
                        </Flex>
                        
                        <Paragraph style={{ fontSize: 15, color: '#334155', lineHeight: 1.6, marginBottom: 16 }}>
                          {comment.content}
                        </Paragraph>
                        
                        <Flex align="center" gap="middle">
                          <Button 
                            type="link" 
                            style={{ padding: 0, color: '#64748b', fontWeight: 600 }}
                            onClick={() => {
                              setReplyingTo(replyingTo === comment.id ? null : comment.id);
                              setReplyText('');
                            }}
                          >
                            Trả lời
                          </Button>
                          <Button type="text" shape="circle" size="small" icon={<MoreOutlined style={{ color: '#94a3b8' }} />} />
                        </Flex>

                        {/* Input reply form */}
                        {replyingTo === comment.id && (
                          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <Input 
                              value={replyText} 
                              onChange={e => setReplyText(e.target.value)} 
                              placeholder="Nhập phản hồi..." 
                              onPressEnter={() => handleAddReply(comment.id)}
                            />
                            <Button type="primary" onClick={() => handleAddReply(comment.id)}>Gửi</Button>
                          </div>
                        )}

                        {/* Render replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div style={{ marginTop: 16, paddingLeft: 16, borderLeft: '2px solid #e2e8f0' }}>
                            {comment.replies.map(reply => (
                              <div key={reply.id} style={{ marginBottom: 12 }}>
                                <Flex gap="small" align="flex-start">
                                  <Avatar size={28} icon={<UserOutlined />} style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
                                  <div>
                                    <Text strong style={{ fontSize: 14 }}>{reply.author}</Text>
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{reply.createdAt}</Text>
                                    <Paragraph style={{ margin: 0, marginTop: 4, fontSize: 14 }}>{reply.content}</Paragraph>
                                  </div>
                                </Flex>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Flex>
                  </List.Item>
                )}
              />
            </div>
          </Col>

          {/* ========== CỘT PHẢI (Sidebar) ========== */}
          <Col xs={24} lg={6}>
            <div style={{ position: 'sticky', top: 24 }}>
              <Card 
                title={<Title level={5} style={{ margin: 0, fontWeight: 700 }}>Câu hỏi liên quan</Title>}
                bordered={false} 
                style={{ borderRadius: 12, boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={MOCK_RELATED_QUESTIONS}
                  renderItem={item => (
                    <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                      <List.Item.Meta
                        title={
                          <a href="#" style={{ color: '#1e293b', fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                            {item.title}
                          </a>
                        }
                        description={
                          <Space style={{ marginTop: 4 }}>
                            <EyeOutlined style={{ color: '#94a3b8' }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>{item.views} lượt xem</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          </Col>

        </Row>
      </div>
    </ConfigProvider>
  );
};

export default QuestionDetail;