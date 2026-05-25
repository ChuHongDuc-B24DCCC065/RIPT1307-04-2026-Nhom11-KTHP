import React, { useState, useMemo } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Select, 
  message, 
  Tag, 
  ConfigProvider, 
  Alert,
  Space
} from 'antd';
import { 
  InfoCircleOutlined, 
  PlusOutlined,
  SafetyCertificateOutlined,
  HolderOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'react-quill-new/dist/quill.snow.css';
import './CreateQuestion.css';

const { Title } = Typography;

const CreateQuestion: React.FC = () => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Đọc dữ liệu từ localStorage an toàn trong khối try-catch
  const parsedUser = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error("Lỗi parse user data:", e);
      return null;
    }
  }, []);

  const username = parsedUser?.username || 'bạn';

  const onFinish = async (values: any) => {
    if (!content || !content.trim() || content === '<p><br></p>') {
      message.error('Vui lòng nhập nội dung chi tiết!');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions`, {
        title: values.title,
        description: content, 
        tags: values.tags ? values.tags.join(',') : ''
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.status === 201 || res.status === 200) {
        message.success("Đăng câu hỏi thành công!");
        form.resetFields();
        setContent('');
        navigate('/');
      }
    } catch (err: any) {
      console.error("Lỗi đăng câu hỏi:", err);
      message.error(err.response?.data?.message || "Không thể đăng câu hỏi!");
    } finally {
      setLoading(false);
    }
  };

  // Tối ưu và sửa lỗi đếm từ/ký tự bằng useMemo để tránh re-render liên tục gây crash
  const { charCount, wordCount } = useMemo(() => {
    if (!content) return { charCount: 0, wordCount: 0 };
    
    const plainText = content.replace(/(<([^>]+)>)/gi, "").replace(/&nbsp;/gi, " ").trim();
    if (!plainText) return { charCount: 0, wordCount: 0 };

    return {
      charCount: plainText.length,
      wordCount: plainText.split(/\s+/).filter(Boolean).length
    };
  }, [content]);

  const modules = {
    toolbar: [
      ['bold', 'italic'],
      ['link', 'image', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          fontFamily: 'inherit',
        },
        components: {
          Card: {
            borderRadiusOuter: 12,
          }
        }
      }}
    >
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px 20px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          
          {parsedUser && (
            <Alert 
              title={
                <span>
                  <b>Trạng thái đăng nhập đã xác thực.</b> Chào mừng bạn quay trở lại, {username}. Bạn có thể đăng bài ngay bây giờ.
                </span>
              } 
              type="info" 
              showIcon 
              icon={<SafetyCertificateOutlined style={{ color: '#0ea5e9', fontSize: 18, marginTop: 2 }} />} 
              style={{ 
                backgroundColor: '#e0f2fe', 
                borderColor: '#bae6fd', 
                color: '#0369a1',
                borderRadius: 8,
                marginBottom: 32,
                padding: '12px 16px',
                fontSize: 15
              }} 
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                Đặt một câu hỏi mới
              </Title>
              <div style={{ display: 'flex', gap: 2, marginTop: 4, opacity: 0.3 }}>
                 <HolderOutlined style={{ fontSize: 18, color: '#64748b', transform: 'rotate(90deg)' }} />
              </div>
            </div>
            <Tag style={{ borderRadius: 20, padding: '6px 14px', color: '#64748b', backgroundColor: '#f1f5f9', border: 'none', fontSize: 14 }}>
              Tự động lưu vào nháp
            </Tag>
          </div>

          <Card
            variant="borderless"
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              border: '1px solid #e2e8f0',
              padding: '8px'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              initialValues={{ tags: ['React', 'Frontend', 'TypeScript'] }}
            >
              <Form.Item
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề câu hỏi' }]}
                label={
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Tiêu đề câu hỏi</div>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 400, marginTop: 4 }}>
                      Hãy mô tả ngắn gọn vấn đề của bạn một cách cụ thể nhất.
                    </div>
                  </div>
                }
              >
                <Input 
                  size="large" 
                  placeholder="Ví dụ: Làm thế nào để sử dụng useEffect tối ưu trong React 18?" 
                  style={{ marginTop: 4, borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="tags"
                rules={[{ required: true, message: 'Vui lòng thêm ít nhất một thẻ' }]}
                label={
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Gắn thẻ (Tags)</div>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 400, marginTop: 4 }}>
                      Thêm tối đa 5 thẻ để câu hỏi của bạn tiếp cận đúng người.
                    </div>
                  </div>
                }
              >
                <Select
                  className="custom-select-tags"
                  mode="tags"
                  size="large"
                  placeholder="Thêm thẻ khác..."
                  style={{ marginTop: 4 }}
                  maxCount={5}
                  tagRender={(props) => {
                    const { label, closable, onClose } = props;
                    return (
                      <Tag
                        color="purple"
                        closable={closable}
                        onClose={onClose}
                        style={{ 
                          marginRight: 4, 
                          borderRadius: 6,
                          color: '#6366f1',
                          backgroundColor: '#eef2ff',
                          borderColor: '#eef2ff',
                          padding: '4px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 14
                        }}
                      >
                        {label}
                      </Tag>
                    );
                  }}
                  options={[
                    { value: 'React', label: 'React' },
                    { value: 'Frontend', label: 'Frontend' },
                    { value: 'TypeScript', label: 'TypeScript' }
                  ]}
                />
              </Form.Item>

              <div style={{ marginTop: 24, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Nội dung chi tiết</div>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 400, marginTop: 4 }}>
                  Cung cấp tất cả thông tin cần thiết: code, lỗi (log), và những gì bạn đã thử.
                </div>
              </div>
              
              <div style={{ position: 'relative', marginBottom: 32, marginTop: 12 }}>
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  placeholder="Hãy viết nội dung của bạn tại đây..."
                  className="custom-quill"
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: 12, 
                  right: 16, 
                  fontSize: 13, 
                  color: '#94a3b8',
                  zIndex: 10 // Đảm bảo không bị chìm dưới các layer khác
                }}>
                  Số từ: {wordCount} | Ký tự: {charCount}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderTop: '1px solid #f1f5f9',
                paddingTop: 24,
                marginTop: 24
              }}>
                <div style={{ color: '#64748b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <InfoCircleOutlined />
                  Bằng cách đăng bài, bạn đồng ý với Điều khoản cộng đồng.
                </div>
                <Space size="middle">
                  <Button size="large" onClick={() => navigate('/')} style={{ borderRadius: 8, padding: '0 24px', fontWeight: 500 }}>
                    Hủy
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    size="large"
                    icon={<PlusOutlined />}
                    style={{ borderRadius: 8, padding: '0 24px', fontWeight: 500 }}
                  >
                    Đăng bài
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default CreateQuestion;