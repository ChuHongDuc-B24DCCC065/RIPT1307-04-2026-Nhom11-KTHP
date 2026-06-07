import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Progress, Spin, message, Typography, Space, Tag, Modal, Button } from 'antd';
import { 
  UserOutlined, 
  FileTextOutlined, 
  MessageOutlined, 
  LikeOutlined, 
  WarningOutlined, 
  DashboardOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { STORAGE_KEYS } from '../constants/storageKeys';

const { Title, Text } = Typography;
const { confirm } = Modal;

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [statsData, setStatsData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Kiểm tra Role bảo mật (AD01)
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
          message.error('Bạn không có quyền truy cập trang này.');
          navigate('/');
          return;
        }
      } catch (e) {
        navigate('/');
        return;
      }
    } else {
      navigate('/login');
      return;
    }
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/admin/detailed-stats');
        setStatsData(res.data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu thống kê:', error);
        message.info('Sử dụng dữ liệu mẫu (Mock Data) do API chưa sẵn sàng hoặc lỗi.');
        setStatsData({
          totalUsers: 15240,
          usersGrowth: 5.2,
          totalPosts: 4120,
          postsGrowth: 3.1,
          totalComments: 102500,
          commentsGrowth: 12.5,
          totalVotes: 310500,
          votesGrowth: 8.4,
          pendingReportsCount: 25,
          latestPosts: [
            { key: '1', title: 'Cách tối ưu React Performance', author: 'Nguyen Van A', status: 'Công khai', date: '29/05/2026' },
            { key: '2', title: 'Tại sao Node.js lại single-threaded?', author: 'Tran B', status: 'Nháp', date: '29/05/2026' },
            { key: '3', title: 'Bán tài khoản ChatGPT giá rẻ', author: 'Spammer_123', status: 'Bị ẩn', date: '28/05/2026' },
            { key: '4', title: 'Hướng dẫn deploy Next.js lên Vercel', author: 'Le C', status: 'Công khai', date: '28/05/2026' },
          ],
          tagDistribution: [
            { name: 'Javascript', value: 33.7, count: 1240 },
            { name: 'React', value: 23.1, count: 850 },
            { name: 'TailwindCSS', value: 16.8, count: 620 },
            { name: 'Next.js', value: 14.7, count: 540 },
            { name: 'UI/UX Design', value: 11.7, count: 430 },
          ],
          pendingReports: [
            { key: '1', reportedUser: 'Spammer_123', content: 'Bán tài khoản ChatGPT...', reason: 'Spam/Quảng cáo', reportCount: 15 },
            { key: '2', reportedUser: 'Toxic_User', content: 'Mày code ngu quá...', reason: 'Xúc phạm người khác', reportCount: 8 },
            { key: '3', reportedUser: 'Hack_Bot', content: 'Link tải tool hack miễn phí...', reason: 'Chứa mã độc/Lừa đảo', reportCount: 12 },
          ],
          growthData: [
            { date: '23/05', newUsers: 120, newPosts: 45 },
            { date: '24/05', newUsers: 150, newPosts: 60 },
            { date: '25/05', newUsers: 110, newPosts: 35 },
            { date: '26/05', newUsers: 180, newPosts: 80 },
            { date: '27/05', newUsers: 210, newPosts: 95 },
            { date: '28/05', newUsers: 160, newPosts: 50 },
            { date: '29/05', newUsers: 240, newPosts: 110 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', flexDirection: 'column' }}>
        <Spin size="large" />
        <Title level={4} style={{ marginTop: 20, color: '#64748b' }}>Đang tải dữ liệu dashboard...</Title>
      </div>
    );
  }

  // Xác thực thao tác
  const handleActionReport = (action: string, record: any) => {
    confirm({
      title: 'Xác nhận thao tác',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn ${action === 'delete' ? 'XÓA' : action === 'warn' ? 'CẢNH CÁO' : 'BỎ QUA'} báo cáo đối với nội dung của "${record.reportedUser}"?`,
      okText: 'Xác nhận',
      okType: action === 'delete' ? 'danger' : 'primary',
      cancelText: 'Hủy',
      onOk() {
        message.success(`Đã thực hiện ${action} thành công.`);
        // Call API here in the future
      },
    });
  };

  const kpiCards = [
    { title: 'Tổng người dùng', value: statsData?.totalUsers || 0, growth: statsData?.usersGrowth || 0, icon: <UserOutlined />, color: '#1890ff' },
    { title: 'Tổng bài đăng', value: statsData?.totalPosts || 0, growth: statsData?.postsGrowth || 0, icon: <FileTextOutlined />, color: '#52c41a' },
    { title: 'Tổng bình luận & trả lời', value: statsData?.totalComments || 0, growth: statsData?.commentsGrowth || 0, icon: <MessageOutlined />, color: '#722ed1' },
    { title: 'Tổng lượt vote', value: statsData?.totalVotes || 0, growth: statsData?.votesGrowth || 0, icon: <LikeOutlined />, color: '#eb2f96' },
  ];

  const latestPostColumns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Tác giả', dataIndex: 'author', key: 'author' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'Công khai') color = 'success';
        else if (status === 'Bị ẩn') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { title: 'Ngày đăng', dataIndex: 'date', key: 'date' },
  ];

  const pendingReportColumns = [
    { title: 'Người bị báo cáo', dataIndex: 'reportedUser', key: 'reportedUser', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Nội dung vi phạm', dataIndex: 'content', key: 'content', render: (text: string) => <Text type="secondary" ellipsis style={{ maxWidth: 150 }}>{text}</Text> },
    { title: 'Lý do report', dataIndex: 'reason', key: 'reason' },
    { 
      title: 'Số lượt', 
      dataIndex: 'reportCount', 
      key: 'reportCount',
      render: (count: number) => <Tag color="error">{count} lượt</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" type="primary" danger onClick={() => handleActionReport('delete', record)}>Xóa</Button>
          <Button size="small" style={{ borderColor: '#faad14', color: '#faad14' }} onClick={() => handleActionReport('warn', record)}>Cảnh cáo</Button>
          <Button size="small" onClick={() => handleActionReport('ignore', record)}>Bỏ qua</Button>
        </Space>
      ),
    },
  ];

  const growthColumns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Người dùng mới', dataIndex: 'newUsers', key: 'newUsers', render: (val: number) => <Text type="success">+{val}</Text> },
    { title: 'Bài đăng mới', dataIndex: 'newPosts', key: 'newPosts', render: (val: number) => <Text type="success">+{val}</Text> },
  ];

  return (
    <div style={{ padding: '0 12px' }}>
      <Title level={3} style={{ marginBottom: 24, fontWeight: 700, color: '#1e293b' }}>
        <DashboardOutlined /> Bảng điều khiển Admin
      </Title>

      {/* 1. KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiCards.map((card, index) => (
          <Col span={5} xs={24} sm={12} lg={5} key={index}>
            <Card
              variant="borderless"
              style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ 
                  backgroundColor: `${card.color}15`, 
                  color: card.color, 
                  borderRadius: '50%', 
                  width: 40, height: 40, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, marginRight: 12
                }}>
                  {card.icon}
                </div>
                <Text type="secondary" style={{ fontWeight: 600, fontSize: 14 }}>{card.title}</Text>
              </div>
              <div>
                <Title level={3} style={{ margin: 0, color: '#1e293b' }}>
                  {card.value.toLocaleString()}
                </Title>
                <Text type="success" style={{ display: 'flex', alignItems: 'center', marginTop: 8, fontSize: 13, fontWeight: 500 }}>
                  <ArrowUpOutlined style={{ marginRight: 4 }} /> {card.growth}% <Text type="secondary" style={{ marginLeft: 4 }}>vs tháng trước</Text>
                </Text>
              </div>
            </Card>
          </Col>
        ))}

        {/* Warning Card for Pending Reports */}
        <Col span={4} xs={24} sm={24} lg={4}>
          <Card
            variant="borderless"
            style={{ 
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              backgroundColor: statsData?.pendingReportsCount > 20 ? '#fff1f0' : '#fff'
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ 
                backgroundColor: '#ff4d4f15', 
                color: '#ff4d4f', 
                borderRadius: '50%', 
                width: 40, height: 40, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginRight: 12
              }}>
                <WarningOutlined />
              </div>
              <Text type="danger" style={{ fontWeight: 600, fontSize: 14 }}>Báo cáo chờ xử lý</Text>
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: '#cf1322' }}>
                {statsData?.pendingReportsCount || 0}
              </Title>
              <Text type="danger" style={{ marginTop: 8, fontSize: 13, fontWeight: 500, display: 'block' }}>
                Cần xử lý ngay!
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {/* Growth Chart */}
        <Col span={16} xs={24} lg={16}>
          <Card 
            title={<Text strong style={{ fontSize: 16 }}>Danh sách Tăng trưởng (7 ngày qua)</Text>}
            variant="borderless" 
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table 
              columns={growthColumns} 
              dataSource={statsData?.growthData || []} 
              rowKey="date"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        {/* Tag Distribution */}
        <Col span={8} xs={24} lg={8}>
          <Card 
            title={<Text strong style={{ fontSize: 16 }}>Thống kê Chủ đề (Tags)</Text>}
            variant="borderless" 
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="large">
              {(statsData?.tagDistribution || []).map((tag: any, idx: number) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong>{tag.name}</Text>
                    <Text type="secondary">{tag.value}% ({tag.count})</Text>
                  </div>
                  <Progress 
                    percent={tag.value} 
                    showInfo={false} 
                    strokeColor={idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : idx === 2 ? '#8b5cf6' : idx === 3 ? '#f59e0b' : '#ec4899'} 
                    trailColor="#f1f5f9"
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Latest Posts */}
        <Col span={12} xs={24} lg={12}>
          <Card 
            title={<Text strong style={{ fontSize: 16 }}>Bài viết mới nhất (AD10)</Text>}
            variant="borderless" 
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table 
              columns={latestPostColumns} 
              dataSource={statsData?.latestPosts || []} 
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        {/* Pending Reports */}
        <Col span={12} xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                <Text strong style={{ fontSize: 16 }}>Báo cáo chờ xử lý</Text>
              </Space>
            }
            variant="borderless" 
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table 
              columns={pendingReportColumns} 
              dataSource={statsData?.pendingReports || []} 
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
