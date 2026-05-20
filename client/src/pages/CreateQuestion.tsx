import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';


const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);



  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          type="text"
        >
          Quay lại trang chủ
        </Button>
      </Space>

      <Card>
        <Title level={2} style={{ marginBottom: 30 }}>Đặt câu hỏi mới</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          Hãy mô tả chi tiết vấn đề của bạn để cộng đồng có thể hỗ trợ tốt nhất.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Tiêu đề câu hỏi"
            name="title"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề!' },

            ]}
          >
            <Input placeholder="Ví dụ: Làm thế nào để sử dụng React Hooks hiệu quả?" size="large" />
          </Form.Item>

          <Form.Item
            label="Nội dung chi tiết"
            name="description"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung chi tiết!' },

            ]}
          >
            <TextArea 
              rows={8} 
              placeholder="Mô tả chi tiết vấn đề, những gì bạn đã thử và kết quả mong muốn..." 
            />
          </Form.Item>

          <Form.Item
            label="Gắn thẻ (Tags)"
            name="tags"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thẻ!' }]}
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Chọn hoặc nhập thẻ (ví dụ: reactjs, javascript...)"
              options={[
                { value: 'reactjs', label: 'ReactJS' },
                { value: 'nodejs', label: 'NodeJS' },
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'mysql', label: 'MySQL' },
                { value: 'mongodb', label: 'MongoDB' },
                { value: 'css', label: 'CSS' },
                { value: 'html', label: 'HTML' },
              ]}
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 40 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              icon={<SendOutlined />} 
              loading={loading}
              block
            >
              Đăng câu hỏi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateQuestion;
