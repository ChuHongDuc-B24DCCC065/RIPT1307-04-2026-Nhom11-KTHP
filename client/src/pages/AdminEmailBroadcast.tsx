import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Radio, 
  Select, 
  Table, 
  Modal, 
  message, 
  Typography, 
  Space, 
  Tag 
} from 'antd';
import { SendOutlined, HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import MarkdownEditor from '../components/MarkdownEditor';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface BroadcastHistoryItem {
  id: string;
  time: string;
  title: string;
  recipientCount: number;
  sender: string;
}

const initialHistory: BroadcastHistoryItem[] = [
  {
    id: '1',
    time: '29/05/2026 14:30',
    title: 'Cập nhật nội quy diễn đàn tháng 6/2026',
    recipientCount: 15240,
    sender: 'Admin (System)',
  },
  {
    id: '2',
    time: '28/05/2026 09:15',
    title: 'Thông báo bảo trì máy chủ dự kiến',
    recipientCount: 15100,
    sender: 'SuperAdmin',
  },
  {
    id: '3',
    time: '25/05/2026 16:45',
    title: 'Khen thưởng các cá nhân đóng góp tích cực',
    recipientCount: 50,
    sender: 'Admin (Community)',
  }
];

const AdminEmailBroadcast: React.FC = () => {
  const [form] = Form.useForm();
  const [targetType, setTargetType] = useState<string>('all');
  const [content, setContent] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<BroadcastHistoryItem[]>(initialHistory);

  const handleSendBroadcast = () => {
    form.validateFields().then((values) => {
      if (!content || content === '<p><br></p>') {
        message.error('Vui lòng nhập nội dung thông báo!');
        return;
      }

      let recipientText = 'tất cả người dùng';
      if (targetType === 'roles') {
        recipientText = `nhóm người dùng: ${values.roles.join(', ')}`;
      } else if (targetType === 'specific') {
        recipientText = `${values.specificUsers.length} người dùng đích danh`;
      }

      confirm({
        title: 'Xác nhận gửi thông báo',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn chuẩn bị gửi email/thông báo cho ${recipientText}. Hành động này không thể hoàn tác. Tiếp tục?`,
        okText: 'Gửi',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          setIsSending(true);
          try {
            // Giả lập API call trigger queue
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            message.success('Đã đưa tác vụ gửi thông báo vào hàng đợi (Queue) thành công!');
            
            // Thêm vào lịch sử (Mock)
            const newItem: BroadcastHistoryItem = {
              id: Date.now().toString(),
              time: new Date().toLocaleString('vi-VN'),
              title: values.title,
              recipientCount: targetType === 'all' ? 15240 : (targetType === 'roles' ? 8000 : values.specificUsers.length),
              sender: 'Current Admin',
            };
            
            setHistoryList([newItem, ...historyList]);
            
            // Reset form
            form.resetFields();
            setContent('');
            setTargetType('all');
            
          } catch (error) {
            message.error('Có lỗi xảy ra khi gửi thông báo.');
          } finally {
            setIsSending(false);
          }
        }
      });
    }).catch(() => {
      message.error('Vui lòng điền đầy đủ các trường bắt buộc!');
    });
  };

  const columns = [
    { 
      title: 'Thời gian', 
      dataIndex: 'time', 
      key: 'time',
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    { 
      title: 'Tiêu đề thông báo', 
      dataIndex: 'title', 
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>
    },
    { 
      title: 'Số người nhận', 
      dataIndex: 'recipientCount', 
      key: 'recipientCount',
      render: (count: number) => <Tag color="blue">{count.toLocaleString()} người</Tag>
    },
    { 
      title: 'Người gửi', 
      dataIndex: 'sender', 
      key: 'sender' 
    },
  ];

  return (
    <div style={{ padding: '0 12px' }}>
      <Title level={3} style={{ marginBottom: 24, fontWeight: 700, color: '#1e293b' }}>
        <SendOutlined /> Gửi Thông báo & Email
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Khu vực soạn thảo */}
        <Card 
          title={<Text strong style={{ fontSize: 16 }}>Soạn thảo thông báo</Text>} 
          bordered={false}
          style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <Form 
            form={form} 
            layout="vertical"
            initialValues={{ targetType: 'all' }}
          >
            <Form.Item 
              name="title" 
              label={<Text strong>Tiêu đề thông báo</Text>}
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
            >
              <Input placeholder="Nhập tiêu đề thông báo (VD: Bảo trì hệ thống...)" size="large" />
            </Form.Item>

            <Form.Item 
              name="targetType" 
              label={<Text strong>Đối tượng nhận (Target Audience)</Text>}
              rules={[{ required: true }]}
            >
              <Radio.Group onChange={(e) => setTargetType(e.target.value)} size="large">
                <Radio value="all">Tất cả người dùng</Radio>
                <Radio value="roles">Nhóm theo Vai trò</Radio>
                <Radio value="specific">Đích danh (Email/Username)</Radio>
              </Radio.Group>
            </Form.Item>

            {targetType === 'roles' && (
              <Form.Item 
                name="roles" 
                label={<Text strong>Chọn nhóm vai trò</Text>}
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhóm!' }]}
              >
                <Select 
                  mode="multiple" 
                  placeholder="Chọn vai trò (VD: Sinh viên, Giảng viên)" 
                  size="large"
                  options={[
                    { value: 'Sinh viên', label: 'Sinh viên' },
                    { value: 'Giảng viên', label: 'Giảng viên' },
                    { value: 'Cựu sinh viên', label: 'Cựu sinh viên' },
                  ]}
                />
              </Form.Item>
            )}

            {targetType === 'specific' && (
              <Form.Item 
                name="specificUsers" 
                label={<Text strong>Nhập danh sách Email / Username</Text>}
                rules={[{ required: true, message: 'Vui lòng nhập ít nhất một người nhận!' }]}
              >
                <Select 
                  mode="tags" 
                  placeholder="Gõ và nhấn Enter để thêm (VD: user@example.com)" 
                  size="large"
                />
              </Form.Item>
            )}

            <Form.Item label={<Text strong>Nội dung chi tiết</Text>} required>
              <MarkdownEditor 
                value={content} 
                onChange={setContent} 
                placeholder="Soạn nội dung chi tiết của thông báo/email tại đây..."
              />
            </Form.Item>

            <Form.Item style={{ marginTop: '24px' }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<SendOutlined />} 
                onClick={handleSendBroadcast}
                loading={isSending}
                style={{ width: '200px', borderRadius: '8px' }}
              >
                Gửi thông báo
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Lịch sử gửi */}
        <Card 
          title={
            <Space>
              <HistoryOutlined style={{ color: '#1890ff' }} />
              <Text strong style={{ fontSize: 16 }}>Lịch sử gửi (Broadcast History)</Text>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          styles={{ body: { padding: 0 } }}
        >
          <Table 
            columns={columns} 
            dataSource={historyList} 
            rowKey="id" 
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default AdminEmailBroadcast;
