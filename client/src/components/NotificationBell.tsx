import React, { useState, useEffect } from 'react';
import { Badge, Popover, List, Avatar, Typography, Button, Flex, theme, Spin, Empty, message, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';

const { Text } = Typography;
const { useToken } = theme;

interface NotificationItem {
  id: string | number;
  content: string;
  link: string;
  isRead: boolean;
  time: string;
  user: {
    name: string;
    avatar: string;
  };
}

// Hàm phân tách tên người gửi và hành động từ nội dung thông báo
const parseNotificationContent = (fullContent: string) => {
  const match = fullContent.match(/^(\S+)\s+(đã\s+.*)$/);
  if (match) {
    return {
      username: match[1],
      action: match[2],
    };
  }
  return {
    username: 'Hệ thống',
    action: fullContent,
  };
};

// Hàm chuyển đổi thời gian MySQL sang dạng thời gian tương đối
const getRelativeTime = (dateStr: string): string => {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return 'vừa xong';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  } catch (e) {
    return 'vừa xong';
  }
};

export const NotificationBell: React.FC = () => {
  const { token } = useToken();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5); // Số lượng thông báo hiển thị ban đầu

  const isLoggedIn = !!localStorage.getItem('token');

  // Hàm tải danh sách thông báo từ API
  const fetchNotifications = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const response = await axiosInstance.get('/notifications');
      if (response.data && response.data.success) {
        const mapped = response.data.data.map((item: any) => {
          const parsed = parseNotificationContent(item.content);
          return {
            id: item.id,
            content: parsed.action,
            link: item.link || '/',
            isRead: item.is_read === 1,
            time: getRelativeTime(item.created_at),
            user: {
              name: parsed.username,
              avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${parsed.username}`,
            }
          };
        });
        setNotifications(mapped);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Thiết lập lấy dữ liệu ban đầu và Polling định kỳ mỗi 15 giây
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Tính toán số lượng thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Đánh dấu tất cả đã đọc thông qua API
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic Update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      const response = await axiosInstance.put('/notifications/read-all');
      if (response.data && response.data.success) {
        message.success('Đã đánh dấu đọc tất cả thông báo');
      } else {
        fetchNotifications(); // Rollback bằng cách tải lại
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Không thể đánh dấu đọc tất cả');
      fetchNotifications(); // Rollback
    }
  };

  // Đánh dấu đã đọc một thông báo và điều hướng thông minh
  const handleItemClick = async (item: NotificationItem) => {
    setOpen(false);

    if (!item.isRead) {
      // Optimistic Update
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
      );

      try {
        await axiosInstance.put(`/notifications/${item.id}/read`);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (item.link) {
      navigate(item.link);
    }
  };

  // Lấy ra danh sách thông báo giới hạn theo visibleCount
  const displayedNotifications = notifications.slice(0, visibleCount);

  // Giao diện tiêu đề Popover
  const popoverTitle = (
    <Flex 
      justify="space-between" 
      align="center" 
      style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}
    >
      <Text strong style={{ fontSize: 16 }}>
        Thông báo {isLoggedIn ? `(${notifications.length})` : ''}
      </Text>
      {isLoggedIn && (
        <Flex gap={8} align="center">
          {/* Nút Làm mới (Refresh) thông báo */}
          <Tooltip title="Làm mới">
            <Button 
              type="text" 
              size="small" 
              icon={<SyncOutlined spin={loading} />} 
              onClick={async () => {
                setLoading(true);
                await fetchNotifications();
                setLoading(false);
              }}
              style={{ color: token.colorTextSecondary }}
            />
          </Tooltip>

          {/* Nút Đánh dấu tất cả là đã đọc (bỏ text span, thêm hover tooltip) */}
          <Tooltip title="Đánh dấu tất cả là đã đọc">
            <Button 
              type="text" 
              size="small" 
              icon={<CheckOutlined />} 
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              style={{ color: unreadCount > 0 ? token.colorPrimary : token.colorTextDisabled }}
            />
          </Tooltip>
        </Flex>
      )}
    </Flex>
  );

  // Giao diện nội dung Popover dựa trên trạng thái đăng nhập
  const popoverContent = (
    <div style={{ width: 360, height: 500, display: 'flex', flexDirection: 'column' }}>
      {!isLoggedIn ? (
        <Flex vertical align="center" justify="center" style={{ padding: '24px 16px', flex: 1 }}>
          <Empty description="Vui lòng đăng nhập để xem thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <Button type="primary" onClick={() => { setOpen(false); navigate('/login'); }} style={{ marginTop: 12 }}>
            Đăng nhập ngay
          </Button>
        </Flex>
      ) : loading && notifications.length === 0 ? (
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Spin />
        </Flex>
      ) : notifications.length === 0 ? (
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Flex>
      ) : (
        <>
          <List
            itemLayout="horizontal"
            dataSource={displayedNotifications}
            style={{ flex: 1, overflowY: 'auto' }}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: item.isRead ? 'transparent' : token.colorPrimaryBg,
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.user.avatar} size="large" />}
                  title={
                    <Text style={{ fontSize: 14 }}>
                      <Text strong>{item.user.name}</Text> {item.content}
                    </Text>
                  }
                  description={<Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>}
                />
              </List.Item>
            )}
          />
          {visibleCount < notifications.length && (
            <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
              <Button 
                type="link" 
                onClick={() => setVisibleCount(prev => prev + 5)} 
                style={{ fontSize: 14, fontWeight: 600, padding: 0, height: 'auto' }}
              >
                Tải thêm thông báo
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      title={popoverTitle}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayInnerStyle={{ padding: 0 }} // Xóa padding mặc định của Popover để custom layout
    >
      <Badge count={unreadCount} size="small" color="#ef4444" offset={[-2, 2]}>
        <div className="bell-icon-wrapper" style={{ cursor: 'pointer', padding: '4px' }}>
          <BellOutlined style={{ fontSize: '20px' }} />
        </div>
      </Badge>
    </Popover>
  );
};
