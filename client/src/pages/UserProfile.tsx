import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Avatar, Button, Tabs, List, Space, Tag, Modal, message } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, MailOutlined, IdcardOutlined, MessageOutlined, ClockCircleOutlined, PhoneOutlined, BankOutlined, GlobalOutlined, InfoCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import EditProfileModal from '../components/EditProfileModal';

const { Title, Text } = Typography;

interface Question {
  id: number;
  title: string;
  description: string; 
  tags: string | string[];
  author_id?: number;
  created_at?: string;
}

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [myQuestions, setMyQuestions] = useState<Question[]>([]); // Data động từ Backend
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hàm lấy câu hỏi của riêng user này từ Backend
  const fetchMyQuestions = async () => {
  if (!user) return;
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/user/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const questions = res.data.data || [];
    setMyQuestions(questions);
  } catch (error: any) {
    // Token hết hạn → tự động đăng xuất
    if (error.response?.status === 401) {
      message.warning('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    message.error("Không thể tải câu hỏi của bạn");
  } finally {
    setLoading(false);
  }
};

  // Hàm lấy câu hỏi đã đánh dấu
  const fetchBookmarkedQuestions = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarkedQuestions(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi tải câu hỏi đã đánh dấu:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchMyQuestions();
      fetchBookmarkedQuestions();
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          const fetchedUser = res.data.data;
          setUser((prevUser: any) => {
            const newUser = { ...prevUser, ...fetchedUser };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải profile:", error);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;


  const handleDeleteQuestion = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          // Gọi API xóa câu hỏi cụ thể
          await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success(`Đã xóa câu hỏi thành công!`);
          fetchMyQuestions(); // Tải lại danh sách sau khi xóa
        } catch (error) {
          message.error("Xóa thất bại!");
        }
      }
    });
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <MessageOutlined /> Câu hỏi của tôi
        </span>
      ),
      children: (
        <List
          itemLayout="vertical"
          size="large"
          loading={loading}
          dataSource={myQuestions}
          locale={{ emptyText: 'Bạn chưa đăng câu hỏi nào.' }}
          renderItem={(item) => {
            // Xử lý nếu tags từ DB trả về chuỗi json hoặc string ngăn cách bởi dấu phẩy
            const parsedTags = typeof item.tags === 'string' ? item.tags.split(',') : (item.tags || []);
            
            return (
              <List.Item
                key={item.id}
                style={{ padding: '20px 0' }}
                actions={[
                  <Space key="time"><ClockCircleOutlined /> {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : 'Vừa xong'}</Space>,
                  <Button 
                    key="edit"
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => navigate(`/edit-question/${item.id}`)}
                    style={{ color: '#1890ff' }}
                  >
                    Sửa
                  </Button>,
                  <Button 
                    key="delete"
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteQuestion(item.id)}
                  >
                    Xóa
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Link to={`/questions/${item.id}`} style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {item.title}
                    </Link>
                  }
                  description={
                    <Space wrap>
                      {parsedTags.map((tag: string) => (
                        <Tag key={tag} color="geekblue">#{tag.trim()}</Tag>
                      ))}
                    </Space>
                  }
                />
                <div style={{ color: '#555', marginTop: 10 }}>
                  {item.description && item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
                </div>
              </List.Item>
            );
          }}
        />
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <BookOutlined /> Đã đánh dấu
        </span>
      ),
      children: (
        <List
          itemLayout="vertical"
          size="large"
          loading={loading}
          dataSource={bookmarkedQuestions}
          locale={{ emptyText: 'Bạn chưa đánh dấu câu hỏi nào.' }}
          renderItem={(item) => {
            const parsedTags = typeof item.tags === 'string' ? item.tags.split(',') : (item.tags || []);
            return (
              <List.Item
                key={item.id}
                style={{ padding: '20px 0' }}
                actions={[
                  <Space key="time"><ClockCircleOutlined /> Đánh dấu lúc: {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}</Space>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Link to={`/questions/${item.id}`} style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {item.title}
                    </Link>
                  }
                  description={
                    <Space wrap>
                      {parsedTags.map((tag: string) => (
                        <Tag key={tag} color="geekblue">#{tag.trim()}</Tag>
                      ))}
                    </Space>
                  }
                />
                <div style={{ color: '#555', marginTop: 10 }}>
                  {item.description && item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
                </div>
              </List.Item>
            );
          }}
        />
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <ClockCircleOutlined /> Hoạt động gần đây
        </span>
      ),
      children: (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Text type="secondary">Tính năng đang được phát triển...</Text>
        </div>
      ),
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Row gutter={24}>
        {/* Cột trái */}
        <Col xs={24} md={8}>
          <Card 
            className="profile-card"
            cover={<div style={{ height: 120, background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)', borderRadius: '8px 8px 0 0' }} />}
            style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' }}
          >
            <Avatar 
              size={100} 
              icon={<UserOutlined />} 
              style={{ marginTop: -50, border: '4px solid white', backgroundColor: '#f56a00', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} 
            />
            <Title level={3} style={{ marginTop: 15, marginBottom: 5 }}>{user.username}</Title>
            <Tag color={user.role === 'admin' ? 'red' : user.role === 'teacher' ? 'magenta' : 'blue'} style={{ marginBottom: 20 }}>
              {user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}
            </Tag>
            
            <div style={{ textAlign: 'left', marginTop: 20, padding: '0 10px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><MailOutlined /> EMAIL</Text>
                  <Text strong>{user.email || 'chua_cap_nhat@example.com'}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><IdcardOutlined /> HỌ TÊN</Text>
                  <Text strong>{user.fullName || user.username}</Text>
                </div>
                {user.phoneNumber && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><PhoneOutlined /> SỐ ĐIỆN THOẠI</Text>
                    <Text strong>{user.phoneNumber}</Text>
                  </div>
                )}
                {user.school && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><BankOutlined /> TRƯỜNG HỌC</Text>
                    <Text strong>{user.school}</Text>
                  </div>
                )}
                {user.website && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><GlobalOutlined /> WEBSITE</Text>
                    <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer"><Text strong style={{ color: '#1890ff' }}>{user.website}</Text></a>
                  </div>
                )}
                {user.bio && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><InfoCircleOutlined /> GIỚI THIỆU</Text>
                    <Text strong>{user.bio}</Text>
                  </div>
                )}
              </Space>
              
              <Button 
                type="primary" 
                block 
                icon={<EditOutlined />} 
                style={{ marginTop: 30, height: '40px', borderRadius: '6px' }}
                onClick={() => setIsEditModalVisible(true)}
              >
                Chỉnh sửa hồ sơ
              </Button>
            </div>
          </Card>
        </Col>

        {/* Cột phải */}
        <Col xs={24} md={16}>
          <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            {/* Sử dụng thuộc tính items mới */}
            <Tabs defaultActiveKey="1" size="large" items={tabItems} />
          </Card>
        </Col>
      </Row>

      {/* Modal Chỉnh sửa hồ sơ đã tách ra component riêng */}
      <EditProfileModal
        user={user}
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={(updatedUser) => {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setIsEditModalVisible(false);
          window.dispatchEvent(new Event('storage'));
        }}
      />
    </div>
  );
};

export default UserProfile;