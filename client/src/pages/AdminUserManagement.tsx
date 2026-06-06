import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Popconfirm, 
  message, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Tooltip,
  Modal
} from 'antd';
import {
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  EditOutlined
} from '@ant-design/icons';
import axiosInstance from '../utils/axiosConfig';
import dayjs from 'dayjs';



interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  status: 'active' | 'banned';
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false);



  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await axiosInstance.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
    } catch (error: any) {
      console.error('Fetch data error:', error);
      message.error("Lỗi khi tải dữ liệu người dùng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter, statusFilter]); // Tự động reload khi đổi filter

  const handleSearch = () => {
    fetchData();
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
      await axiosInstance.put(`/admin/users/${id}/status`, { status: newStatus });
      message.success(`Đã ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản!`);
      fetchData();
    } catch (error) {
      message.error('Thao tác thất bại!');
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleModalVisible(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      await axiosInstance.put(`/admin/users/${selectedUser.id}/role`, { role: newRole });
      message.success('Cập nhật quyền thành công!');
      setIsRoleModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Cập nhật quyền thất bại!');
    }
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalVisible(true);
  };

  const handleResetPassword = async (type: 'email' | 'random') => {
    if (!selectedUser) return;
    try {
      await axiosInstance.post(`/admin/users/${selectedUser.id}/reset-password`, { type });
      if (type === 'email') {
         message.success(`Đã gửi link reset mật khẩu đến email của người dùng!`);
      } else {
         message.success(`Đã reset và cấp mật khẩu ngẫu nhiên cho người dùng!`);
      }
      setIsResetPasswordModalVisible(false);
    } catch (error) {
      message.error('Reset mật khẩu thất bại!');
    }
  };

  const getRoleTag = (role: string) => {
    switch (role) {
      case 'admin':
        return <Tag color="purple">Admin</Tag>;
      case 'teacher':
        return <Tag color="blue">Giảng viên</Tag>;
      case 'student':
        return <Tag color="green">Sinh viên</Tag>;
      default:
        return <Tag>{role}</Tag>;
    }
  };

  const getStatusTag = (status: string) => {
    if (status === 'active') return <Tag color="success">Hoạt động</Tag>;
    if (status === 'banned') return <Tag color="error">Bị khóa</Tag>;
    return <Tag>{status}</Tag>;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Vai trò', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => getRoleTag(role)
    },
    { 
      title: 'Ngày tham gia', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A'
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => getStatusTag(status || 'active') // Default to active if undefined
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: User) => {
        // Fallback status
        const currentStatus = record.status || 'active';
        return (
          <Space>
            <Tooltip title={currentStatus === 'banned' ? "Mở khóa tài khoản" : "Khóa tài khoản"}>
              <Popconfirm
                title={`Bạn có chắc muốn ${currentStatus === 'banned' ? 'mở khóa' : 'khóa'} tài khoản này?`}
                onConfirm={() => toggleUserStatus(record.id, currentStatus)}
                okText="Đồng ý"
                cancelText="Hủy"
                okButtonProps={{ danger: currentStatus !== 'banned' }}
              >
                <Button 
                  type="text" 
                  danger={currentStatus !== 'banned'} 
                  icon={currentStatus === 'banned' ? <UnlockOutlined /> : <LockOutlined />} 
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="Đổi quyền">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => openRoleModal(record)}
              />
            </Tooltip>
            <Tooltip title="Reset mật khẩu">
              <Button 
                type="text" 
                icon={<KeyOutlined />} 
                onClick={() => openResetPasswordModal(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Quản lý Người dùng</h2>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="Tìm kiếm theo email hoặc username..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
          />
          <Select 
            value={roleFilter} 
            onChange={(val) => setRoleFilter(val)} 
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'Tất cả vai trò' },
              { value: 'student', label: 'Sinh viên' },
              { value: 'teacher', label: 'Giảng viên' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <Select 
            value={statusFilter} 
            onChange={(val) => setStatusFilter(val)} 
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'banned', label: 'Bị khóa' },
            ]}
          />
          <Button type="primary" onClick={handleSearch}>Lọc</Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} người dùng`
        }}
      />

      <Modal
        title="Đổi quyền người dùng"
        open={isRoleModalVisible}
        onOk={handleRoleChange}
        onCancel={() => setIsRoleModalVisible(false)}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          <p>Người dùng: <strong>{selectedUser?.username}</strong></p>
          <p>Email: <strong>{selectedUser?.email}</strong></p>
        </div>
        <Select
          value={newRole}
          onChange={(val) => setNewRole(val)}
          style={{ width: '100%' }}
          options={[
            { value: 'student', label: 'Sinh viên' },
            { value: 'teacher', label: 'Giảng viên' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
      </Modal>

      <Modal
        title="Reset Mật khẩu"
        open={isResetPasswordModalVisible}
        onCancel={() => setIsResetPasswordModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 24 }}>
          <p>Bạn muốn reset mật khẩu cho người dùng <strong>{selectedUser?.username}</strong> ({selectedUser?.email}) bằng cách nào?</p>
        </div>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button block type="primary" onClick={() => handleResetPassword('email')}>
            Gửi Link Reset qua Email
          </Button>
          <Button block danger onClick={() => handleResetPassword('random')}>
            Tạo Mật Khẩu Ngẫu Nhiên Mới
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default AdminUserManagement;
