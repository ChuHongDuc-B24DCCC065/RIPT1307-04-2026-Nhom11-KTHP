import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Avatar, Button, Tabs, List, Space, Tag, Modal, Form, Input, message } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, MailOutlined, IdcardOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

    }
  }, [user, navigate]);

  if (!user) return null;


  };

  const handleDeleteQuestion = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',

            style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' }}
          >
            <Avatar 
              size={100} 
              icon={<UserOutlined />} 

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
              </Space>
              
              <Button 
                type="primary" 
                block 
                icon={<EditOutlined />} 
                style={{ marginTop: 30, height: '40px', borderRadius: '6px' }}
                onClick={() => {
                  form.setFieldsValue({
                    fullName: user.fullName || user.username,
                    email: user.email || ''
                  });
                  setIsEditModalVisible(true);
                }}
              >
                Chỉnh sửa hồ sơ
              </Button>
            </div>
          </Card>
        </Col>


          </Card>
        </Col>
      </Row>

      {/* Modal Chỉnh sửa hồ sơ */}
      <Modal
        title="Cập nhật thông tin cá nhân"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        centered

      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}

            <Input placeholder="example@student.ptit.edu.vn" size="large" />
          </Form.Item>
          
          <Form.Item label="Tên đăng nhập (Mặc định)">
            <Input value={user.username} disabled size="large" />
          </Form.Item>
          

          </div>
        </Form>
      </Modal>
    </div>
  );
};

