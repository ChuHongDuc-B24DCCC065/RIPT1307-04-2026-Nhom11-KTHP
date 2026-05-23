import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Timeline, Progress, Spin, message, Typography, Space, Divider } from 'antd';
import { 
  UserOutlined, 
  FileTextOutlined, 
  MessageOutlined, 
  LikeOutlined, 
  WarningOutlined, 
  HistoryOutlined, 
  CheckCircleOutlined, 
  DashboardOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/admin/detailed-stats');
        setStatsData(res.data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu thống kê:', error);
        // Fallback to mock data for demonstration if API fails or not implemented yet
        message.info('Sử dụng dữ liệu mẫu (Mock Data) do API chưa sẵn sàng hoặc lỗi.');
        setStatsData({
          totalUsers: 1250,
          totalQuestions: 450,
          totalAnswers: 1800,
          totalVotes: 3200,
          reportedQuestions: [
            { key: '1', title: 'Tại sao React lại khó học?', reports: 12, author: 'nguyenvana' },
            { key: '2', title: 'Lỗi khi cài đặt Node.js trên Windows 11', reports: 8, author: 'tranb' },
            { key: '3', title: 'Hỏi về cách config Tailwind CSS', reports: 5, author: 'ledc' },
            { key: '4', title: 'Xin đồ án mẫu môn Web', reports: 15, author: 'phamf' },
          ],
          activities: [
            { id: '1', content: 'Admin A vừa xóa bài viết vi phạm', time: '10 phút trước', color: 'red' },
            { id: '2', content: 'Người dùng B vừa đăng ký tài khoản', time: '1 giờ trước', color: 'green' },
            { id: '3', content: 'Cảnh báo hệ thống: Lượng request tăng cao', time: '2 giờ trước', color: 'orange' },
            { id: '4', content: 'Admin C đã duyệt 5 câu hỏi mới', time: '4 giờ trước', color: 'blue' },
          ],
          acceptedAnswerRate: 68,
          teacherStudentRatio: { teacher: 15, student: 85 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', flexDirection: 'column' }}>
        <Spin size="large" />
        <Title level={4} style={{ marginTop: 20, color: '#64748b' }}>Đang tải dữ liệu tổng quan...</Title>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Tổng người dùng', value: statsData?.totalUsers || 0, icon: <UserOutlined />, color: '#1890ff', bgColor: '#e6f7ff' },
    { title: 'Tổng câu hỏi', value: statsData?.totalQuestions || 0, icon: <FileTextOutlined />, color: '#52c41a', bgColor: '#f6ffed' },
    { title: 'Câu trả lời & Bình luận', value: statsData?.totalAnswers || 0, icon: <MessageOutlined />, color: '#722ed1', bgColor: '#f9f0ff' },
    { title: 'Tổng lượt tương tác', value: statsData?.totalVotes || 0, icon: <LikeOutlined />, color: '#fa8c16', bgColor: '#fff7e6' },
  ];

  const columns = [
    { title: 'Tiêu đề bài viết/câu hỏi', dataIndex: 'title', key: 'title' },
    { title: 'Người đăng', dataIndex: 'author', key: 'author' },
    { 
      title: 'Lượt báo cáo', 
      dataIndex: 'reports', 
      key: 'reports', 
      render: (text: number) => (
        <Space>
          <WarningOutlined style={{ color: '#ff4d4f' }} />
          <Text type="danger" strong>{text}</Text>
        </Space>
      )
    },
  ];

  return (
    <div style={{ padding: '0 12px' }}>
      <Title level={3} style={{ marginBottom: 24, fontWeight: 700, color: '#1e293b' }}>
        <DashboardOutlined /> Dashboard Tổng Quan
      </Title>

      {/* 1. Khối Số liệu tổng quan (KPI Cards) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiCards.map((card, index) => (
          <Col span={6} xs={24} sm={12} lg={6} key={index}>
            <Card
              bordered={false}
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
                background: `linear-gradient(145deg, #ffffff 40%, ${card.bgColor} 100%)`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              hoverable
              bodyStyle={{ padding: '24px' }}
            >
              <Statistic
                title={<span style={{ fontWeight: 600, color: '#64748b', fontSize: '15px' }}>{card.title}</span>}
                value={card.value}
                valueStyle={{ color: card.color, fontWeight: 800, fontSize: '32px', marginTop: '8px' }}
                prefix={
                  <div style={{ 
                    backgroundColor: card.color, 
                    color: 'white', 
                    borderRadius: '12px', 
                    marginRight: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    fontSize: '24px',
                    boxShadow: `0 4px 12px ${card.color}40`
                  }}>
                    {card.icon}
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 3. Thống kê tỷ lệ bằng Progress */}
      <Card 
        bordered={false} 
        style={{ borderRadius: '16px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)', marginBottom: 24 }}
        bodyStyle={{ padding: '24px' }}
      >
        <Title level={5} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> Phân tích tỷ lệ hệ thống
        </Title>
        <Row gutter={32} align="middle">
          <Col span={8} xs={24} md={8} style={{ textAlign: 'center' }}>
            <Progress 
              type="circle" 
              percent={statsData?.acceptedAnswerRate || 0} 
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              strokeWidth={12}
              size={150}
              format={percent => <span style={{ fontWeight: 800, fontSize: '28px', color: '#1e293b' }}>{percent}%</span>}
            />
            <div style={{ marginTop: 16, fontWeight: 600, color: '#475569', fontSize: '15px' }}>
              Tỷ lệ câu hỏi đã có câu trả lời
            </div>
          </Col>
          
          <Col span={1} xs={0} md={1} style={{ display: 'flex', justifyContent: 'center' }}>
            <Divider type="vertical" style={{ height: '120px' }} />
          </Col>

          <Col span={15} xs={24} md={15}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                <Text strong style={{ fontSize: '15px' }}>Tỷ lệ người dùng là Giảng viên</Text>
                <Text type="secondary" strong>{statsData?.teacherStudentRatio?.teacher || 0}%</Text>
              </div>
              <Progress 
                percent={statsData?.teacherStudentRatio?.teacher || 0} 
                status="active" 
                strokeColor={{ from: '#722ed1', to: '#b37feb' }}
                strokeWidth={12}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                <Text strong style={{ fontSize: '15px' }}>Tỷ lệ người dùng là Sinh viên</Text>
                <Text type="secondary" strong>{statsData?.teacherStudentRatio?.student || 0}%</Text>
              </div>
              <Progress 
                percent={statsData?.teacherStudentRatio?.student || 0} 
                status="active" 
                strokeColor={{ from: '#1890ff', to: '#69c0ff' }}
                strokeWidth={12}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 2. Khối danh sách cảnh báo/hoạt động */}
      <Row gutter={[24, 24]}>
        <Col span={16} xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14', fontSize: '18px' }} /> 
                <span style={{ fontWeight: 600 }}>Các bài viết bị báo cáo vi phạm nhiều nhất</span>
              </Space>
            }
            bordered={false} 
            style={{ borderRadius: '16px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)', height: '100%' }}
            headStyle={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Table 
              columns={columns} 
              dataSource={statsData?.reportedQuestions || []} 
              pagination={{ pageSize: 4 }}
              size="middle"
            />
          </Card>
        </Col>
        <Col span={8} xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <HistoryOutlined style={{ color: '#1890ff', fontSize: '18px' }} /> 
                <span style={{ fontWeight: 600 }}>Lịch sử hoạt động hệ thống</span>
              </Space>
            }
            bordered={false} 
            style={{ borderRadius: '16px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)', height: '100%' }}
            headStyle={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <Timeline style={{ marginTop: '8px' }}>
              {(statsData?.activities || []).map((activity: any) => (
                <Timeline.Item key={activity.id} color={activity.color}>
                  <div style={{ marginBottom: '4px', fontWeight: 500, color: '#334155' }}>
                    {activity.content}
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>{activity.time}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
