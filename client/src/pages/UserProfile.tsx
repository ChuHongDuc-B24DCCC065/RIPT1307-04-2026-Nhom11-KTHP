import React, { useState, useEffect, useCallback } from 'react';
import { 
  ConfigProvider, Typography, Form, Input, Button, Upload, 
  Row, Col, Space, Avatar, message, Flex, Divider, Card, Layout, Tabs, List, Dropdown, Tag, Segmented, Empty, Tooltip
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  UserOutlined, MailOutlined, LockOutlined, CameraOutlined, 
  SaveOutlined, SafetyCertificateOutlined, DownOutlined, 
  MessageOutlined, InboxOutlined, PhoneOutlined, BankOutlined, 
  GlobalOutlined, BookOutlined, EyeOutlined,
  LikeOutlined, CommentOutlined, ClockCircleOutlined,
  TeamOutlined, UserDeleteOutlined, IdcardOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Content } = Layout;
const { TextArea } = Input;

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Helper: Avatar gradient ---
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

// --- Interfaces ---
interface QuestionItem {
  id: number;
  title: string;
  description: string;
  tags: string;
  votes: number;
  views: number;
  answer_count: number;
  created_at: string;
}

interface FollowUser {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar: string | null;
  created_at: string;
}

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [user, setUser] = useState<Record<string, any> | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  // State cho "Giới thiệu" - theo dõi thay đổi form
  const [hasChanges, setHasChanges] = useState(false);
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});

  // State cho "Câu hỏi của tôi"
  const [myQuestions, setMyQuestions] = useState<QuestionItem[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // State cho "Theo dõi"
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followSegment, setFollowSegment] = useState<string>('following');
  const [followLoading, setFollowLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          const fetchedUser = res.data.data;
          setUser((prevUser: Record<string, any> | null) => {
            const newUser = { ...prevUser, ...fetchedUser };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
          });
          const vals = {
            fullName: fetchedUser.fullName || fetchedUser.username,
            email: fetchedUser.email,
            bio: fetchedUser.bio || '',
            phoneNumber: fetchedUser.phoneNumber || '',
            school: fetchedUser.school || '',
            website: fetchedUser.website || '',
            class_name: fetchedUser.class_name || ''
          };
          form.setFieldsValue(vals);
          setInitialValues(vals);
        }
      } catch (error) {
        console.error("Lỗi khi tải profile:", error);
      }
    };
    if (user) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Fetch follow counts
  const fetchFollowCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/users/${user.id}/follow-counts`);
      if (res.data.success) {
        setFollowCounts({ followers: res.data.followers, following: res.data.following });
      }
    } catch (e) { /* ignore */ }
  }, [user]);

  useEffect(() => {
    fetchFollowCounts();
  }, [fetchFollowCounts]);

  // Fetch my questions
  const fetchMyQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/questions/user/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMyQuestions(res.data.data);
      }
    } catch (e) {
      console.error('Lỗi tải câu hỏi:', e);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  // Fetch followers/following
  const fetchFollowData = useCallback(async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`${API}/users/${user.id}/followers`),
        axios.get(`${API}/users/${user.id}/following`)
      ]);
      if (followersRes.data.success) setFollowers(followersRes.data.data);
      if (followingRes.data.success) setFollowing(followingRes.data.data);
    } catch (e) {
      console.error('Lỗi tải dữ liệu theo dõi:', e);
    } finally {
      setFollowLoading(false);
    }
  }, [user]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'questions') fetchMyQuestions();
    if (activeTab === 'follow') fetchFollowData();
  }, [activeTab, fetchMyQuestions, fetchFollowData]);

  // Handle profile save (Giới thiệu)
  const onFinishProfile = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API}/users/profile`, {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        school: values.school,
        bio: values.bio,
        website: values.website,
        className: values.class_name,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      message.success('Cập nhật thông tin thành công!');
      
      const updatedUser = { 
        ...user, 
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        school: values.school,
        bio: values.bio,
        website: values.website,
        class_name: values.class_name,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('storage'));
      
      // Reset initial values to current
      setInitialValues(values);
      setHasChanges(false);
    } catch {
      message.error("Không thể cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

  // Handle password change (Cài đặt tài khoản)
  const onFinishPassword = async (values: Record<string, any>) => {
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/users/profile`, {
        fullName: user?.fullName || user?.username,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Đổi mật khẩu thành công!');
      passwordForm.resetFields();
    } catch {
      message.error("Mật khẩu hiện tại không chính xác!");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Track form changes
  const handleValuesChange = (_: any, allValues: Record<string, any>) => {
    const changed = Object.keys(initialValues).some(
      key => (allValues[key] || '') !== (initialValues[key] || '')
    );
    setHasChanges(changed);
  };

  // Unfollow
  const handleUnfollow = async (targetId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/${targetId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Đã hủy theo dõi');
      fetchFollowData();
      fetchFollowCounts();
    } catch {
      message.error('Không thể thực hiện');
    }
  };

  if (!user) return null;

  // --- Card styling ---
  const cardStyle = {
    borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginTop: 24
  };

  // ======== TAB: GIỚI THIỆU ========
  const renderAboutTab = () => (
    <Card 
      styles={{ body: { padding: '32px' } }} 
      style={cardStyle}
    >
      <div style={{ marginBottom: 16 }}>
        <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            backgroundColor: '#eef2ff', color: '#6366f1', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>
            <UserOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Thông tin cơ bản</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Quản lý thông tin cá nhân của bạn</Text>
          </div>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item 
              name="fullName" 
              label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }}/>} size="large" placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="email" 
              label={<span style={{ fontWeight: 500 }}>Địa chỉ Email</span>}
              extra={<span style={{ fontSize: 13, color: '#94a3b8' }}>Email không thể thay đổi sau khi đăng ký</span>}
            >
              <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }}/>} size="large" disabled />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item 
              name="bio" 
              label={<span style={{ fontWeight: 500 }}>Giới thiệu bản thân</span>}
            >
              <TextArea 
                rows={3} 
                placeholder="Viết vài dòng giới thiệu về bạn..."
                style={{ borderRadius: 10 }}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="phoneNumber" 
              label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
            >
              <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }}/>} size="large" placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="school" 
              label={<span style={{ fontWeight: 500 }}>Trường học</span>}
            >
              <Input prefix={<BankOutlined style={{ color: '#bfbfbf' }}/>} size="large" placeholder="Nhập tên trường" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="class_name" 
              label={<span style={{ fontWeight: 500 }}>Lớp</span>}
            >
              <Input prefix={<IdcardOutlined style={{ color: '#bfbfbf' }}/>} size="large" placeholder="Nhập tên lớp" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="website" 
              label={<span style={{ fontWeight: 500 }}>Website / GitHub</span>}
            >
              <Input prefix={<GlobalOutlined style={{ color: '#bfbfbf' }}/>} size="large" placeholder="https://github.com/username" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Nút Hủy / Lưu chỉ hiện khi có thay đổi */}
      {hasChanges && (
        <>
          <Divider style={{ margin: '24px 0 20px 0' }} />
          <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
            <Space style={{ color: '#64748b', fontSize: 14 }}>
              <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: 18 }} />
              Mọi thay đổi sẽ được cập nhật tức thì sau khi lưu.
            </Space>
            <Space size="middle">
              <Button type="text" onClick={() => { form.setFieldsValue(initialValues); setHasChanges(false); }} size="large">Hủy thay đổi</Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SaveOutlined />}>Lưu thông tin</Button>
            </Space>
          </Flex>
        </>
      )}
    </Card>
  );

  // ======== TAB: CÂU HỎI CỦA TÔI ========
  const renderQuestionsTab = () => (
    <Card 
      styles={{ body: { padding: '32px' } }} 
      style={cardStyle}
    >
      <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: '50%', 
          backgroundColor: '#eef2ff', color: '#6366f1', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20
        }}>
          <BookOutlined />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Câu hỏi của tôi ({myQuestions.length})</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Danh sách các câu hỏi bạn đã đăng trên diễn đàn</Text>
        </div>
      </Flex>

      {myQuestions.length === 0 && !questionsLoading ? (
        <Empty 
          description="Bạn chưa đăng câu hỏi nào"
          style={{ padding: '40px 0' }}
        >
          <Button type="primary" onClick={() => navigate('/create-question')} style={{ borderRadius: 10, background: '#6366f1' }}>
            Đặt câu hỏi đầu tiên
          </Button>
        </Empty>
      ) : (
        <List
          loading={questionsLoading}
          itemLayout="vertical"
          dataSource={myQuestions}
          renderItem={(q) => (
            <Card 
              hoverable
              onClick={() => navigate(`/questions/${q.id}`)}
              style={{ borderRadius: 14, marginBottom: 12, border: '1px solid #f0f0f0', cursor: 'pointer' }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 16, color: '#1e293b', display: 'block', marginBottom: 8 }}>
                    {q.title}
                  </Text>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#64748b', fontSize: 13.5, margin: 0, marginBottom: 10 }}>
                    {q.description?.replace(/<[^>]*>/g, '')}
                  </Paragraph>
                  <Space size={[6, 6]} wrap>
                    {q.tags && q.tags.split(',').map((tag: string) => (
                      <Tag key={tag.trim()} bordered={false} style={{ backgroundColor: '#eef2ff', color: '#6366f1', borderRadius: 6, fontWeight: 500 }}>
                        {tag.trim()}
                      </Tag>
                    ))}
                  </Space>
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center' }}>
                  <Tooltip title="Lượt thích">
                    <Space size={4} style={{ color: '#64748b', fontSize: 13 }}>
                      <LikeOutlined /> {q.votes || 0}
                    </Space>
                  </Tooltip>
                  <Tooltip title="Câu trả lời">
                    <Space size={4} style={{ color: '#64748b', fontSize: 13 }}>
                      <CommentOutlined /> {q.answer_count || 0}
                    </Space>
                  </Tooltip>
                  <Tooltip title="Lượt xem">
                    <Space size={4} style={{ color: '#64748b', fontSize: 13 }}>
                      <EyeOutlined /> {q.views || 0}
                    </Space>
                  </Tooltip>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {dayjs(q.created_at).fromNow()}
                </Text>
              </div>
            </Card>
          )}
        />
      )}
    </Card>
  );

  // ======== TAB: THEO DÕI ========
  const renderFollowTab = () => {
    const currentList = followSegment === 'following' ? following : followers;
    const emptyText = followSegment === 'following' 
      ? 'Bạn chưa theo dõi ai' 
      : 'Chưa có ai theo dõi bạn';

    return (
      <Card 
        styles={{ body: { padding: '32px' } }} 
        style={cardStyle}
      >
        <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            backgroundColor: '#eef2ff', color: '#6366f1', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>
            <TeamOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Theo dõi</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {followCounts.following} đang theo dõi · {followCounts.followers} người theo dõi
            </Text>
          </div>
        </Flex>

        <Segmented
          value={followSegment}
          onChange={(val) => setFollowSegment(val as string)}
          options={[
            { label: `Đang theo dõi (${following.length})`, value: 'following' },
            { label: `Người theo dõi (${followers.length})`, value: 'followers' }
          ]}
          block
          style={{ marginBottom: 20 }}
        />

        {currentList.length === 0 && !followLoading ? (
          <Empty description={emptyText} style={{ padding: '40px 0' }} />
        ) : (
          <List
            loading={followLoading}
            grid={{ gutter: 16, column: 2, xs: 1, sm: 1, md: 2 }}
            dataSource={currentList}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  styles={{ body: { padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }} 
                  style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                >
                  <Space size="middle">
                    <Avatar 
                      size={52} 
                      style={{ 
                        background: getAvatarGradient(item.full_name || item.username),
                        color: '#fff',
                        fontWeight: 700,
                        border: '2px solid #eef2ff' 
                      }}
                    >
                      {(item.full_name || item.username || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text strong style={{ fontSize: 15, display: 'block' }}>{item.full_name || item.username}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>@{item.username}</Text>
                      {item.bio && (
                        <Paragraph ellipsis={{ rows: 1 }} style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0', maxWidth: 180 }}>
                          {item.bio}
                        </Paragraph>
                      )}
                    </div>
                  </Space>
                  <Space size="small">
                    {followSegment === 'following' && (
                      <Tooltip title="Hủy theo dõi">
                        <Button 
                          danger 
                          type="text" 
                          shape="circle" 
                          icon={<UserDeleteOutlined />} 
                          onClick={() => handleUnfollow(item.id)}
                        />
                      </Tooltip>
                    )}
                    <Tooltip title="Nhắn tin">
                      <Button type="primary" shape="circle" icon={<MessageOutlined />} style={{ background: '#6366f1' }} />
                    </Tooltip>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    );
  };

  // ======== TAB: CÀI ĐẶT TÀI KHOẢN ========
  const renderSettingsTab = () => (
    <Card 
      styles={{ body: { padding: '32px' } }} 
      style={cardStyle}
    >
      {/* Upload ảnh đại diện */}
      <div style={{ marginBottom: 32 }}>
        <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            backgroundColor: '#eef2ff', color: '#6366f1', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>
            <CameraOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Ảnh đại diện</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Thay đổi ảnh đại diện của bạn</Text>
          </div>
        </Flex>
        
        <Dragger 
          name="file" 
          multiple={false} 
          action={`${API}/upload`}
          headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
          onChange={(info) => {
            if (info.file.status === 'done') {
              message.success('Tải ảnh lên thành công!');
              const newAvatar = info.file.response?.avatar;
              if (newAvatar) {
                const serverRoot = API.replace('/api', '');
                const fullAvatarUrl = `${serverRoot}${newAvatar}`;
                const updatedUser = { ...user, avatar: fullAvatarUrl };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                window.dispatchEvent(new Event('storage'));
              }
            } else if (info.file.status === 'error') {
              message.error(info.file.response?.message || 'Tải ảnh lên thất bại!');
            }
          }}
          style={{ background: '#fafafa', borderColor: '#e2e8f0' }}
        >
          <Flex align="center" justify="space-between" style={{ padding: '8px 16px' }}>
            <Flex align="center" gap="middle">
              <div style={{ 
                width: 48, height: 48, borderRadius: '50%', 
                backgroundColor: '#eef2ff', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <InboxOutlined style={{ fontSize: 20, color: '#6366f1' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 500, fontSize: 16 }}>Nhấn để tải ảnh lên hoặc kéo thả vào đây</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>Hỗ trợ SVG, PNG, JPG (Tối đa 5MB)</div>
              </div>
            </Flex>
            <Button>Chọn file</Button>
          </Flex>
        </Dragger>
      </div>

      <Divider style={{ margin: '32px 0' }} />

      {/* Đổi mật khẩu */}
      <div>
        <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            backgroundColor: '#fff3e0', color: '#f59e0b', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>
            <LockOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Đổi mật khẩu</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn</Text>
          </div>
        </Flex>

        <Form form={passwordForm} layout="vertical" onFinish={onFinishPassword}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item 
                name="currentPassword" 
                label={<span style={{ fontWeight: 500 }}>Mật khẩu hiện tại</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="Nhập mật khẩu hiện tại" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item 
                name="newPassword" 
                label={<span style={{ fontWeight: 500 }}>Mật khẩu mới</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="Nhập mật khẩu mới" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item 
                name="confirmPassword" 
                label={<span style={{ fontWeight: 500 }}>Xác nhận mật khẩu mới</span>}
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="Nhập lại mật khẩu mới" />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider style={{ margin: '24px 0 20px 0' }} />
          
          <Flex justify="flex-end">
            <Button type="primary" htmlType="submit" loading={passwordLoading} size="large" icon={<SaveOutlined />}>
              Đổi mật khẩu
            </Button>
          </Flex>
        </Form>
      </div>
    </Card>
  );

  // ======== TAB ITEMS ========
  const moreItems: MenuProps['items'] = [
    { key: 'settings', label: '⚙️ Cài đặt tài khoản', onClick: () => setActiveTab('settings') },
    { key: 'bookmarks', label: '🔖 Bài viết đã lưu' },
    { key: 'notifications', label: '🔔 Cài đặt thông báo' },
  ];

  const tabItems = [
    { key: 'about', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Giới thiệu</span>, children: renderAboutTab() },
    { key: 'questions', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Câu hỏi của tôi</span>, children: renderQuestionsTab() },
    { key: 'follow', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Theo dõi</span>, children: renderFollowTab() },
    { key: 'settings', label: <span style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>Cài đặt tài khoản</span>, children: renderSettingsTab() },
    { 
      key: 'more', 
      label: (
        <Dropdown menu={{ items: moreItems }} trigger={['hover']} placement="bottomRight">
          <Space style={{ fontWeight: 600, fontSize: 15, padding: '0 8px' }}>
            Xem thêm <DownOutlined style={{ fontSize: 12 }} />
          </Space>
        </Dropdown>
      )
    }
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6366f1', borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Content style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={onFinishProfile}
              onValuesChange={handleValuesChange}
              initialValues={{
                fullName: user.fullName || user.username,
                email: user.email,
                bio: user.bio || '',
                phoneNumber: user.phoneNumber || '',
                school: user.school || '',
                website: user.website || '',
                class_name: user.class_name || ''
              }}
            >
              {/* Vùng chứa Header và Tabs Bar */}
              <div style={{ background: '#ffffff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                
                {/* Top Banner */}
                <div style={{ 
                  height: 180, 
                  background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', 
                  position: 'relative'
                }} />
                
                <Flex align="flex-end" style={{ padding: '0 32px 24px 32px', marginTop: -60, position: 'relative', zIndex: 1 }}>
                  <Flex gap="large" align="flex-end">
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                      <Avatar 
                        size={130} 
                        icon={<UserOutlined />} 
                        src={user.avatar}
                        style={{ border: '4px solid #ffffff', backgroundColor: '#f0f0f0', color: '#ccc' }} 
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        border: '2px solid #ffffff'
                      }}>
                        <CameraOutlined style={{ fontSize: 16 }} />
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ paddingBottom: 16, marginTop: 60 }}>
                      <Title level={2} style={{ margin: 0, marginBottom: 8, fontWeight: 700, lineHeight: 1.2 }}>
                        {user.fullName || user.username}
                      </Title>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#64748b' }}>
                        <Space size={4}>
                          <MailOutlined />
                          <Text style={{ color: '#64748b' }}>{user.email || 'Chưa cập nhật email'}</Text>
                        </Space>
                        <Text type="secondary">·</Text>
                        <Space size={4}>
                          <TeamOutlined />
                          <Text style={{ color: '#64748b' }}>{followCounts.followers} người theo dõi</Text>
                        </Space>
                      </div>
                    </div>
                  </Flex>
                </Flex>

                <Divider style={{ margin: 0, borderColor: '#f0f0f0' }} />

                {/* Tabs Bar */}
                <ConfigProvider 
                  theme={{ 
                    components: { 
                      Tabs: { 
                        itemColor: '#64748b', 
                        itemHoverColor: '#1e293b', 
                        itemActiveColor: '#1877f2', 
                        inkBarColor: '#1877f2',
                      } 
                    } 
                  }}
                >
                  <Tabs 
                    activeKey={activeTab}
                    onChange={(key) => { if (key !== 'more') setActiveTab(key); }}
                    items={tabItems}
                    renderTabBar={(props, DefaultTabBar) => (
                      <div style={{ padding: '0 32px' }}>
                        <DefaultTabBar {...props} style={{ borderBottom: 'none', margin: 0 }} />
                      </div>
                    )}
                  />
                </ConfigProvider>
              </div>
            </Form>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default UserProfile;