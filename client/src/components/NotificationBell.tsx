import React, { useState } from 'react';
import { Badge, Popover, List, Avatar, Typography, Button, Flex, theme } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';

const { Text, Link } = Typography;
const { useToken } = theme;

interface NotificationItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
  isRead: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    user: {
      name: 'Nguyễn Văn A',
      avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
    },
    content: 'đã bình luận bài viết của bạn',
    time: '5 phút trước',
    isRead: false,
  },
  {
    id: '2',
    user: {
      name: 'Trần Thị B',
      avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2',
    },
    content: 'Câu hỏi của bạn có 1 câu trả lời mới',
    time: '1 giờ trước',
    isRead: false,
  },
  {
    id: '3',
    user: {
      name: 'Hệ thống',
      avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=3',
    },
    content: 'Bài viết của bạn đã được duyệt',
    time: '2 ngày trước',
    isRead: true,
  },
];

export const NotificationBell: React.FC = () => {
  const { token } = useToken();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [open, setOpen] = useState(false);

  // Tính toán số lượng thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const popoverTitle = (
    <Flex 
      justify="space-between" 
      align="center" 
      style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}
    >
      <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
      <Button 
        type="text" 
        size="small" 
        icon={<CheckOutlined />} 
        onClick={handleMarkAllAsRead}
        disabled={unreadCount === 0}
        style={{ color: unreadCount > 0 ? token.colorPrimary : token.colorTextDisabled }}
      >
        Đánh dấu tất cả là đã đọc
      </Button>
    </Flex>
  );

  const popoverContent = (
    <div style={{ width: 360, maxHeight: 480, display: 'flex', flexDirection: 'column' }}>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        style={{ flex: 1, overflowY: 'auto' }}
        renderItem={(item) => (
          <List.Item
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
      <div style={{ padding: '12px 16px', textAlign: 'center' }}>
        <Link href="/notifications" strong style={{ fontSize: 14 }}>
          Xem tất cả thông báo
        </Link>
      </div>
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
      styles={{ body: { padding: 0 } }} // Xóa padding mặc định của Popover để custom layout
    >
      <Badge count={unreadCount} size="small" color="#ef4444" offset={[-2, 2]}>
        <div className="bell-icon-wrapper">
          <BellOutlined style={{ fontSize: '20px' }} />
        </div>
      </Badge>
    </Popover>
  );
};
