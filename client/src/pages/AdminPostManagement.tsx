import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Popconfirm, 
  message, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tabs, 
  Tag, 
  Tooltip,
  Typography
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  StopOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';


const { RangePicker } = DatePicker;
const { Text } = Typography;

interface Post {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  votes: number;
  reports: number;
  status: 'approved' | 'pending' | 'hidden' | 'rejected' | string;
}

interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  author: string;
  content: string;
  createdAt: string;
  reports: number;
  status: 'public' | 'hidden' | 'violation';
}

const AdminPostManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        // Query params for filtering
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.append('startDate', dateRange[0].startOf('day').toISOString());
          params.append('endDate', dateRange[1].endOf('day').toISOString());
        }

        const res = await axiosInstance.get(`/admin/posts?${params.toString()}`);
        setPosts(res.data.posts || []);
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.append('startDate', dateRange[0].toISOString());
          params.append('endDate', dateRange[1].toISOString());
        }

        const res = await axiosInstance.get(`/admin/comments?${params.toString()}`);
        setComments(res.data.comments || []);
      }
    } catch (error: any) {
      console.error('Fetch data error:', error);
      message.error("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSearch = () => {
    fetchData();
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
  };

  const togglePostStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'hidden' ? 'approved' : 'hidden';
      await axiosInstance.put(`/admin/posts/${id}/status`, { status: newStatus });
      message.success(`Đã ${newStatus === 'hidden' ? 'ẩn' : 'hiện'} bài viết!`);
      fetchData();
    } catch (error) {
      message.error('Thao tác thất bại!');
    }
  };

  const updatePostStatus = async (id: string, newStatus: string) => {
    try {
      await axiosInstance.put(`/admin/posts/${id}/status`, { status: newStatus });
      message.success(`Đã cập nhật trạng thái bài viết thành ${newStatus}!`);
      fetchData();
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại!');
    }
  };

  const deletePost = async (id: string) => {
    try {
      await axiosInstance.delete(`/admin/posts/${id}`);
      message.success('Xóa bài viết thành công!');
      fetchData();
    } catch (error) {
      message.error('Xóa thất bại!');
    }
  };

  const toggleCommentStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'hidden' ? 'public' : 'hidden';
      await axiosInstance.put(`/admin/comments/${id}/status`, { status: newStatus });
      message.success(`Đã ${newStatus === 'hidden' ? 'ẩn' : 'hiện'} bình luận!`);
      fetchData();
    } catch (error) {
      message.error('Thao tác thất bại!');
    }
  };

  const deleteComment = async (id: string) => {
    try {
      await axiosInstance.delete(`/admin/comments/${id}`);
      message.success('Xóa bình luận thành công!');
      fetchData();
    } catch (error) {
      message.error('Xóa thất bại!');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'approved':
      case 'public':
        return <Tag color="success">Công khai</Tag>;
      case 'hidden':
        return <Tag color="default">Bị ẩn</Tag>;
      case 'violation':
        return <Tag color="error">Vi phạm</Tag>;
      case 'pending':
        return <Tag color="warning">Chờ duyệt</Tag>;
      case 'rejected':
        return <Tag color="error">Từ chối</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const postColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: 'Tiêu đề', 
      dataIndex: 'title', 
      key: 'title',
      render: (text: string, record: Post) => (
        <a href={`/questions/${record.id}`} target="_blank" rel="noopener noreferrer">
          <Text ellipsis style={{ maxWidth: 300 }}>{text}</Text>
        </a>
      )
    },
    { title: 'Tác giả', dataIndex: 'author', key: 'author' },
    { 
      title: 'Ngày đăng', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm')
    },
    { title: 'Lượt xem', dataIndex: 'views', key: 'views', width: 100 },
    { title: 'Lượt vote', dataIndex: 'votes', key: 'votes', width: 100 },
    { 
      title: 'Reports', 
      dataIndex: 'reports', 
      key: 'reports', 
      width: 100,
      render: (reports: number) => (
        <span style={{ color: reports > 0 ? 'red' : 'inherit', fontWeight: reports > 0 ? 'bold' : 'normal' }}>
          {reports}
        </span>
      )
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Post) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => window.open(`/questions/${record.id}`, '_blank')}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Duyệt bài">
                <Button 
                  type="text" 
                  icon={<CheckOutlined style={{ color: 'green' }} />} 
                  onClick={() => updatePostStatus(record.id, 'approved')}
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button 
                  type="text" 
                  icon={<CloseOutlined style={{ color: 'red' }} />} 
                  onClick={() => updatePostStatus(record.id, 'rejected')}
                />
              </Tooltip>
            </>
          )}
          {record.status !== 'pending' && (
            <Tooltip title={record.status === 'hidden' ? "Hiện bài viết" : "Ẩn bài viết"}>
              <Popconfirm
                title={`Bạn có chắc muốn ${record.status === 'hidden' ? 'hiện' : 'ẩn'} bài viết này?`}
                onConfirm={() => togglePostStatus(record.id, record.status)}
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Button 
                  type="text" 
                  danger={record.status !== 'hidden'} 
                  icon={record.status === 'hidden' ? <EyeOutlined /> : <EyeInvisibleOutlined />} 
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="Xóa vĩnh viễn">
            <Popconfirm 
              title="CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này?" 
              onConfirm={() => deletePost(record.id)}
              okText="Xóa ngay"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const commentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: 'Bài viết', 
      dataIndex: 'postTitle', 
      key: 'postTitle',
      render: (text: string, record: Comment) => (
        <a href={`/questions/${record.postId}`} target="_blank" rel="noopener noreferrer">
          <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
        </a>
      )
    },
    { title: 'Tác giả', dataIndex: 'author', key: 'author' },
    { 
      title: 'Nội dung', 
      dataIndex: 'content', 
      key: 'content',
      render: (text: string) => <Text ellipsis style={{ maxWidth: 300 }}>{text}</Text>
    },
    { 
      title: 'Ngày đăng', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm')
    },
    { 
      title: 'Reports', 
      dataIndex: 'reports', 
      key: 'reports', 
      width: 100,
      render: (reports: number) => (
        <span style={{ color: reports > 0 ? 'red' : 'inherit', fontWeight: reports > 0 ? 'bold' : 'normal' }}>
          {reports}
        </span>
      )
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Comment) => (
        <Space>
          <Tooltip title={record.status === 'hidden' ? "Hiện bình luận" : "Ẩn bình luận"}>
            <Popconfirm
              title={`Bạn có chắc muốn ${record.status === 'hidden' ? 'hiện' : 'ẩn'} bình luận này?`}
              onConfirm={() => toggleCommentStatus(record.id, record.status)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                danger={record.status !== 'hidden'} 
                icon={record.status === 'hidden' ? <EyeOutlined /> : <StopOutlined />} 
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Xóa vĩnh viễn">
            <Popconfirm 
              title="CẢNH BÁO: Xóa vĩnh viễn bình luận này?" 
              onConfirm={() => deleteComment(record.id)}
              okText="Xóa ngay"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Quản lý Bài viết & Bình luận</h2>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
          />
          <Select 
            value={statusFilter} 
            onChange={handleStatusChange} 
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'approved', label: 'Công khai' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'hidden', label: 'Bị ẩn' },
              { value: 'rejected', label: 'Từ chối' },
              { value: 'violation', label: 'Vi phạm' },
            ]}
          />
          <RangePicker onChange={handleDateChange} />
          <Button type="primary" onClick={handleSearch}>Lọc</Button>
        </Space>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'posts',
            label: 'Danh sách Bài viết',
            children: (
              <Table 
                columns={postColumns} 
                dataSource={posts} 
                rowKey="id" 
                loading={loading}
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} bài viết`
                }}
              />
            ),
          },
          {
            key: 'comments',
            label: 'Danh sách Bình luận',
            children: (
              <Table 
                columns={commentColumns} 
                dataSource={comments} 
                rowKey="id" 
                loading={loading}
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} bình luận`
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdminPostManagement;
