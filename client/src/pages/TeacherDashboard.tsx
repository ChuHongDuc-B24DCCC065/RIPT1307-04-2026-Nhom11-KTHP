import React, { useState, useEffect } from 'react';
import { 
  Card, Col, Row, Statistic, Table, Tabs, Input, Button, Form, 
  Switch, message, Tag, Avatar, Space, Tooltip, Badge, Empty, Typography, Divider
} from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  BookOutlined, 
  LockOutlined, 
  BellOutlined, 
  TeamOutlined, 
  FieldTimeOutlined,
  SendOutlined,
  CalendarOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  followersCount: number;
  questionsCount: number;
  verifiedCount: number;
  closedCount: number;
}

interface QuestionData {
  id: number;
  title: string;
  author: string;
  created_at: string;
  tags: string;
  votes: number;
  views: number;
}

interface AnswerData {
  id: number;
  content: string;
  created_at: string;
  question_title: string;
  question_id: number;
  author_name: string;
}

interface StudentData {
  id: number;
  username: string;
  email: string;
  reputation: number;
  fullName: string | null;
  avatar: string | null;
  questionsCount: number;
  acceptedAnswersCount: number;
  lastActive: string | null;
}

interface TeacherDashboardProps {
  defaultTab?: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ defaultTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unansweredQuestions, setUnansweredQuestions] = useState<QuestionData[]>([]);
  const [pendingAnswers, setPendingAnswers] = useState<AnswerData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [isAvailable, setIsAvailable] = useState(false);
  const [officeHours, setOfficeHours] = useState('');
  
  const [broadcastForm] = Form.useForm();
  const [availabilityForm] = Form.useForm();

  // Tải dữ liệu thống kê & câu hỏi/câu trả lời chờ duyệt
  const fetchDashboardData = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/users/teacher/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.data.stats);
        setUnansweredQuestions(res.data.data.unansweredQuestions);
        setPendingAnswers(res.data.data.pendingAnswers);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông số dashboard:', err);
      message.error('Không thể tải thông tin thống kê giảng viên.');
    } finally {
      setLoadingStats(false);
    }
  };

  // Tải danh sách học sinh đang theo dõi
  const fetchStudentsData = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/users/teacher/students-performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sinh viên:', err);
      message.error('Không thể tải danh sách sinh viên.');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Tải trạng thái sẵn sàng từ profile
  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsAvailable(!!res.data.data.is_available);
        setOfficeHours(res.data.data.office_hours || '');
        availabilityForm.setFieldsValue({
          isAvailable: !!res.data.data.is_available,
          officeHours: res.data.data.office_hours || ''
        });
      }
    } catch (err) {
      console.error('Lỗi tải trạng thái trực tuyến:', err);
    }
  };

  useEffect(() => {
    setActiveTab(defaultTab);
    if (defaultTab === 'students') {
      fetchStudentsData();
    }
  }, [defaultTab]);

  useEffect(() => {
    fetchDashboardData();
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (key: string) => {
    if (key === 'students') {
      fetchStudentsData();
    }
  };

  // Xử lý gửi thông báo broadcast
  const handleBroadcast = async (values: { title: string; content: string }) => {
    setBroadcastLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/users/teacher/broadcast`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        message.success(res.data.message);
        broadcastForm.resetFields();
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Xử lý cập nhật office hours
  const handleAvailabilitySubmit = async (values: { isAvailable: boolean; officeHours: string }) => {
    setAvailabilityLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/users/teacher/availability`, {
        isAvailable: values.isAvailable,
        officeHours: values.officeHours
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        message.success(res.data.message);
        setIsAvailable(values.isAvailable);
        setOfficeHours(values.officeHours);
      }
    } catch (err) {
      console.error(err);
      message.error('Cập nhật trạng thái trực tuyến thất bại.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Cấu hình bảng Câu hỏi chờ hỗ trợ
  const questionColumns = [
    {
      title: 'Tiêu đề câu hỏi',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: QuestionData) => (
        <Link to={`/questions/${record.id}`} style={{ fontWeight: 500, color: '#4f46e5' }}>
          {text}
        </Link>
      )
    },
    {
      title: 'Người hỏi',
      dataIndex: 'author',
      key: 'author',
      width: 140,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string) => (
        <Space size={[0, 4]} wrap>
          {tags.split(',').filter(Boolean).map(t => (
            <Tag key={t} color="purple">#{t}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Lượt xem / bình chọn',
      key: 'activity',
      width: 160,
      render: (_: any, record: QuestionData) => (
        <Space size="middle">
          <span><EyeOutlined /> {record.views}</span>
          <span><TrophyOutlined /> {record.votes}</span>
        </Space>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => dayjs(date).fromNow()
    }
  ];

  // Cấu hình bảng Câu trả lời chờ xác nhận
  const pendingAnswerColumns = [
    {
      title: 'Câu trả lời của sinh viên',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => (
        <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text.replace(/<[^>]*>/g, '')}
        </div>
      )
    },
    {
      title: 'Câu hỏi gốc',
      dataIndex: 'question_title',
      key: 'question_title',
      render: (text: string, record: AnswerData) => (
        <Link to={`/questions/${record.question_id}`} style={{ color: '#4f46e5' }}>
          {text}
        </Link>
      )
    },
    {
      title: 'Sinh viên trả lời',
      dataIndex: 'author_name',
      key: 'author_name',
      width: 150,
      render: (text: string) => <Tag color="cyan">{text}</Tag>
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => dayjs(date).fromNow()
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: any, record: AnswerData) => (
        <Button size="small" type="primary" onClick={() => navigateToQuestion(record.question_id)}>
          Xem chi tiết
        </Button>
      )
    }
  ];

  const navigateToQuestion = (id: number) => {
    window.location.href = `/questions/${id}`;
  };

  // Cấu hình bảng Theo dõi sinh viên
  const studentColumns = [
    {
      title: 'Sinh viên',
      key: 'student',
      render: (_: any, record: StudentData) => (
        <Space>
          <Avatar 
            src={record.avatar || undefined} 
            icon={!record.avatar && <UserOutlined />}
            style={{ backgroundColor: '#87d068' }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{record.fullName || record.username}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Điểm uy tín',
      dataIndex: 'reputation',
      key: 'reputation',
      sorter: (a: StudentData, b: StudentData) => a.reputation - b.reputation,
      render: (rep: number) => (
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <Text strong>{rep}</Text>
        </Space>
      )
    },
    {
      title: 'Số câu hỏi đã đăng',
      dataIndex: 'questionsCount',
      key: 'questionsCount',
      sorter: (a: StudentData, b: StudentData) => a.questionsCount - b.questionsCount,
      render: (count: number) => <Tag color="geekblue">{count} bài viết</Tag>
    },
    {
      title: 'Số câu trả lời được Accept',
      dataIndex: 'acceptedAnswersCount',
      key: 'acceptedAnswersCount',
      sorter: (a: StudentData, b: StudentData) => a.acceptedAnswersCount - b.acceptedAnswersCount,
      render: (count: number) => (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>{count} câu trả lời</span>
        </Space>
      )
    },
    {
      title: 'Hoạt động cuối',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date: string | null) => {
        if (!date) return <Text type="secondary">Chưa có hoạt động</Text>;
        const diffDays = dayjs().diff(dayjs(date), 'day');
        let statusText = 'Tích cực';
        
        if (diffDays > 7) {
          statusText = 'Không hoạt động > 7 ngày';
        } else if (diffDays > 3) {
          statusText = 'Bình thường';
        }

        return (
          <Tooltip title={`Hoạt động gần nhất: ${dayjs(date).format('HH:mm DD/MM/YYYY')}`}>
            <Badge status={diffDays > 7 ? 'error' : diffDays > 3 ? 'warning' : 'success'} text={statusText} />
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '2px' }}>{dayjs(date).fromNow()}</div>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Khung tiêu đề hoành tráng */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
        padding: '32px', 
        borderRadius: '16px', 
        color: '#ffffff', 
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.3)'
      }}>
        <Row align="middle" gutter={24}>
          <Col xs={24} md={18}>
            <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
              👨‍🏫 Bảng Điều Khiển Giảng Viên
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: '8px', fontSize: '16px', marginBottom: 0 }}>
              Quản lý học thuật, theo dõi mức độ tham gia thảo luận của sinh viên, hỗ trợ học tập chuyên sâu và ghim các tài liệu bài tập cần thiết.
            </Paragraph>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Badge status={isAvailable ? 'processing' : 'default'} text={
              <span style={{ color: '#ffffff', fontWeight: 600 }}>
                {isAvailable ? 'Đang trực tuyến giải đáp' : 'Đang ngoại tuyến'}
              </span>
            } />
            {officeHours && (
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '4px' }}>
                Khung giờ trực: {officeHours}
              </div>
            )}
          </Col>
        </Row>
      </div>

      {/* Grid Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <Statistic 
              title={<span style={{ color: '#8c8c8c' }}>Sinh viên theo dõi</span>}
              value={stats?.followersCount ?? 0} 
              prefix={<TeamOutlined style={{ color: '#4f46e5' }} />}
              loading={loadingStats}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <Statistic 
              title={<span style={{ color: '#8c8c8c' }}>Bài viết đã đăng</span>}
              value={stats?.questionsCount ?? 0} 
              prefix={<BookOutlined style={{ color: '#7c3aed' }} />}
              loading={loadingStats}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <Statistic 
              title={<span style={{ color: '#8c8c8c' }}>Câu trả lời đã duyệt</span>}
              value={stats?.verifiedCount ?? 0} 
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              loading={loadingStats}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <Statistic 
              title={<span style={{ color: '#8c8c8c' }}>Luồng thảo luận đã khóa</span>}
              value={stats?.closedCount ?? 0} 
              prefix={<LockOutlined style={{ color: '#ef4444' }} />}
              loading={loadingStats}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs Chức năng */}
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => {
            setActiveTab(key);
            handleTabChange(key);
          }}
          animated={{ inkBar: true, tabPane: true }}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <QuestionCircleOutlined />
                  Hỗ trợ chuyên môn
                </span>
              ),
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <Title level={4} style={{ margin: 0 }}>🙋‍♂️ Câu hỏi chưa có câu trả lời (Chờ hỗ trợ)</Title>
                      <Text type="secondary">Cập nhật liên tục</Text>
                    </div>
                    <Table 
                      dataSource={unansweredQuestions} 
                      columns={questionColumns} 
                      rowKey="id" 
                      loading={loadingStats}
                      pagination={{ pageSize: 5 }}
                      locale={{ emptyText: <Empty description="Không có câu hỏi nào đang chờ hỗ trợ!" /> }}
                    />
                  </div>

                  <Divider />

                  <div>
                    <Title level={4} style={{ marginBottom: '12px' }}>⏱️ Câu trả lời sinh viên mới cập nhật (Chờ xác nhận chuyên môn)</Title>
                    <Table 
                      dataSource={pendingAnswers} 
                      columns={pendingAnswerColumns} 
                      rowKey="id" 
                      loading={loadingStats}
                      pagination={{ pageSize: 5 }}
                      locale={{ emptyText: <Empty description="Tất cả câu trả lời của sinh viên trong bài đăng của bạn đã được duyệt!" /> }}
                    />
                  </div>
                </Space>
              )
            },
            {
              key: 'students',
              label: (
                <span>
                  <TeamOutlined />
                  Theo dõi sinh viên
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Title level={4} style={{ margin: 0 }}>📊 Thống kê tương tác của Sinh viên đang theo dõi bạn</Title>
                    <Text type="secondary">Tổng số: {students.length} sinh viên</Text>
                  </div>
                  <Table 
                    dataSource={students} 
                    columns={studentColumns} 
                    rowKey="id" 
                    loading={loadingStudents}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: <Empty description="Chưa có sinh viên nào theo dõi bạn." /> }}
                  />
                </div>
              )
            },
            {
              key: 'broadcast',
              label: (
                <span>
                  <BellOutlined />
                  Gửi thông báo hàng loạt (Broadcast)
                </span>
              ),
              children: (
                <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 0' }}>
                  <Card bordered style={{ borderRadius: '12px', background: '#fcfcff' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '50%', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '44px', width: '44px' }}>
                        <BellOutlined style={{ fontSize: '20px' }} />
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0 }}>Gửi tin nhắn hàng loạt tới Followers</Title>
                        <Text type="secondary">Thông báo này sẽ được gửi trực tiếp tới hòm thư thông báo của toàn bộ sinh viên đang theo dõi bạn.</Text>
                      </div>
                    </div>

                    <Form 
                      form={broadcastForm} 
                      layout="vertical" 
                      onFinish={handleBroadcast}
                    >
                      <Form.Item 
                        name="title" 
                        label="Tiêu đề thông báo" 
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề thông báo!' }]}
                      >
                        <Input placeholder="Nhập tiêu đề ngắn gọn (Ví dụ: Đã có tài liệu ôn tập Chương 3, Lịch nghỉ học bù...)" size="large" />
                      </Form.Item>
                      
                      <Form.Item 
                        name="content" 
                        label="Nội dung chi tiết" 
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
                      >
                        <TextArea 
                          rows={6} 
                          placeholder="Nhập nội dung chi tiết bài giảng, link tài liệu hoặc nhắc nhở..." 
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          icon={<SendOutlined />} 
                          loading={broadcastLoading}
                          size="large"
                          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', borderRadius: '8px' }}
                        >
                          Gửi thông báo ngay
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              )
            },
            {
              key: 'office-hours',
              label: (
                <span>
                  <CalendarOutlined />
                  Lịch trực tuyến (Office Hours)
                </span>
              ),
              children: (
                <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 0' }}>
                  <Card bordered style={{ borderRadius: '12px' }}>
                    <Title level={4} style={{ marginBottom: '8px' }}>⚙️ Cài đặt khung giờ trực tuyến hỗ trợ</Title>
                    <Paragraph type="secondary">
                      Khi bật chế độ này, sinh viên sẽ thấy chấm xanh trực tuyến "Office Hours" nhấp nháy trên avatar và bài viết của bạn. Họ sẽ biết bạn đang sẵn sàng trực tuyến để trả lời nhanh thắc mắc.
                    </Paragraph>
                    
                    <Divider />

                    <Form 
                      form={availabilityForm} 
                      layout="vertical" 
                      onFinish={handleAvailabilitySubmit}
                    >
                      <Form.Item 
                        name="isAvailable" 
                        label="Trạng thái sẵn sàng hỗ trợ hiện tại" 
                        valuePropName="checked"
                      >
                        <Switch 
                          checkedChildren="ĐANG SẴN SÀNG (ONLINE)" 
                          unCheckedChildren="NGOẠI TUYẾN (OFFLINE)" 
                          style={{ width: 220 }}
                        />
                      </Form.Item>

                      <Form.Item 
                        name="officeHours" 
                        label="Khung giờ hỗ trợ cố định của bạn" 
                        extra="Ví dụ: Thứ 3 & Thứ 5 hàng tuần (20h - 22h)"
                      >
                        <Input 
                          prefix={<FieldTimeOutlined style={{ color: '#bfbfbf' }} />} 
                          placeholder="Ví dụ: Thứ 2, 4, 6 từ 19:00 - 21:00" 
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          loading={availabilityLoading}
                          size="large"
                        >
                          Lưu cài đặt lịch
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default TeacherDashboard;
