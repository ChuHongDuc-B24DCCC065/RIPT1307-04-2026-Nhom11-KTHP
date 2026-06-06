import React, { useState } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import axiosInstance from '../utils/axiosConfig';

interface ToggleUserStatusButtonProps {
  userId: string;
  currentStatus?: string;
  onSuccess: () => void;
}

const ToggleUserStatusButton: React.FC<ToggleUserStatusButtonProps> = ({ 
  userId, 
  currentStatus, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const isBanned = currentStatus === 'banned';

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = isBanned ? 'active' : 'banned';
      
      await axiosInstance.put(
        `/admin/users/${userId}/status`, 
        { status: newStatus }
      );
      
      message.success(`Đã ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} người dùng thành công!`);
      onSuccess();
    } catch (error) {
      console.error('Toggle status error:', error);
      message.error('Thao tác thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popconfirm 
      title={isBanned ? "Mở khóa người dùng này?" : "Khóa người dùng này?"} 
      onConfirm={handleToggleStatus}
      okText="Đồng ý"
      cancelText="Hủy"
    >
      <Button 
        type="link" 
        danger={!isBanned} 
        style={isBanned ? { color: 'green' } : {}} 
        icon={isBanned ? <UnlockOutlined /> : <LockOutlined />}
        loading={loading}
      >
        {isBanned ? 'Mở khóa' : 'Khóa'}
      </Button>
    </Popconfirm>
  );
};

export default ToggleUserStatusButton;
