import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MarkdownEditor from '../components/MarkdownEditor';

const { Title, Paragraph } = Typography;

const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');

  const onFinish = async (values: any) => {
    if (!description.trim()) {
      message.error('Vui lòng nhập nội dung chi tiết!');
      return;
    }

    setLoading(true); 

    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions`, {
        title: values.title,
        description: description, 
        tags: values.tags.join(',') // Khớp định dạng MySQL string "react,node"
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.status === 201 || res.status === 200) {
        message.success("Đăng câu hỏi thành công!");
        form.resetFields();
        setDescription('');
        navigate('/');
      }
    } catch (err: any) {
      console.error("Lỗi đăng câu hỏi:", err);
      message.error(err.response?.data?.message || "Không thể đăng câu hỏi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '12px' }}>
      <Space style={{ marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          type="text"
          style={{ fontWeight: 600, color: '#64748b' }}
        >
          Quay lại trang chủ
        </Button>
      </Space>

      <Card
        bordered={false}
        style={{
          boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.04), 0 8px 12px -6px rgba(0, 0, 0, 0.02)',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '16px'
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>Đặt câu hỏi mới</Title>
          <Paragraph type="secondary" style={{ marginTop: 8, fontSize: '14px', lineHeight: '1.5', color: '#64748b' }}>
            Hãy chia sẻ câu hỏi của bạn với cộng đồng. Mô tả chi tiết vấn đề cùng với các lỗi (nếu có) để nhận được sự trợ giúp tốt nhất và nhanh nhất.
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label={<span style={{ fontWeight: 650, color: '#334155' }}>Tiêu đề câu hỏi</span>}
            name="title"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề câu hỏi!' },
            ]}
          >
            <Input 
              placeholder="Ví dụ: Làm thế nào để giải quyết lỗi CORS trong ExpressJS khi gọi từ React?" 
              size="large" 
              style={{ borderRadius: '10px', height: '42px' }}
            />
          </Form.Item>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 650, color: '#334155', fontSize: '14px' }}>
              Nội dung chi tiết câu hỏi
            </label>
            <MarkdownEditor 
              value={description}
              onChange={setDescription}
              placeholder="Mô tả chi tiết vấn đề, những gì bạn đã thử nghiệm và kết quả mong muốn đạt được..." 
            />
          </div>

          <Form.Item
            label={<span style={{ fontWeight: 650, color: '#334155' }}>Gắn thẻ (Tags)</span>}
            name="tags"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thẻ!' }]}
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Chọn hoặc gõ từ khóa (ví dụ: reactjs, nodejs, python...)"
              options={[
                { value: 'reactjs', label: 'ReactJS' },
                { value: 'nodejs', label: 'NodeJS' },
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'mysql', label: 'MySQL' },
                { value: 'mongodb', label: 'MongoDB' },
                { value: 'css', label: 'CSS' },
                { value: 'html', label: 'HTML' },
                { value: 'python', label: 'Python' },
                { value: 'tailwind', label: 'Tailwind' },
              ]}
              size="large"
              dropdownStyle={{ borderRadius: '12px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 42, marginBottom: 12 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              icon={<SendOutlined />} 
              loading={loading}
              block
              style={{
                borderRadius: '10px',
                height: '46px',
                fontWeight: 600,
                background: '#6366f1',
                borderColor: '#6366f1',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
            >
              Đăng câu hỏi lên diễn đàn
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateQuestion;
