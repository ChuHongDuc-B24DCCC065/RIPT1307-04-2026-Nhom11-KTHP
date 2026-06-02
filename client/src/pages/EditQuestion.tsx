import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './CreateQuestion.css';

const { Title, Text } = Typography;

const modules = {
  toolbar: [
    ['bold', 'italic'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image']
  ],
};

interface EditorWithCounterProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  modules?: any;
}

const EditorWithCounter: React.FC<EditorWithCounterProps> = ({ value, onChange, placeholder, modules }) => {
  const plainText = (value || '').replace(/(<([^>]+)>)/gi, "").replace(/&nbsp;/gi, " ").trim();
  const charCount = plainText.length;
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div style={{ position: 'relative' }}>
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="custom-quill"
      />
      <div className="editor-counter-badge">
        Số từ: {wordCount} | Ký tự: {charCount}
      </div>
    </div>
  );
};

const EditQuestion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/${id}`);
        const question = res.data;

        // Lấy thông tin user từ localStorage
        const userDataString = localStorage.getItem('user');
        if (!userDataString) {
          message.error("Vui lòng đăng nhập để thực hiện chức năng này!");
          navigate('/login');
          return;
        }

        const currentUser = JSON.parse(userDataString);

        // Kiểm tra quyền sở hữu
        // Lưu ý: ID của người dùng trong question có thể nằm ở trường user_id hoặc cấu trúc lồng nhau tùy backend
        const questionUserId = question.user_id || (question.user && question.user.id) || (question.user && question.user._id);
        const currentUserId = currentUser.id || currentUser._id;

        if (questionUserId && questionUserId !== currentUserId && currentUser.role !== 'admin') {
          message.error("Bạn không có quyền chỉnh sửa câu hỏi này!");
          navigate('/');
          return;
        }

        // Xử lý chuỗi tags nếu trả về chuỗi "reactjs,nodejs"
        let processedTags = question.tags;
        if (typeof question.tags === 'string') {
          processedTags = question.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
        } else if (!Array.isArray(question.tags)) {
           processedTags = [];
        }

        form.setFieldsValue({
          title: question.title,
          description: question.description,
          tags: processedTags
        });

      } catch (err: any) {
        console.error("Lỗi lấy thông tin câu hỏi:", err);
        message.error("Không thể tải thông tin câu hỏi!");
        navigate('/');
      } finally {
        setFetching(false);
      }
    };

    fetchQuestion();
  }, [id, form, navigate]);

  const onFinish = async (values: any) => {
    setLoading(true); 

    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/${id}`, {
        title: values.title,
        description: values.description, 
        tags: values.tags // Gửi mảng tags
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.status === 200 || res.status === 204) {
        message.success("Cập nhật câu hỏi thành công!");
        navigate(`/questions/${id}`); // Điều hướng về trang chi tiết câu hỏi
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật câu hỏi:", err);
      message.error(err.response?.data?.message || "Không thể cập nhật câu hỏi!");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)} // Quay lại trang trước
          type="text"
        >
          Quay lại
        </Button>
      </Space>

      <Card>
        <Title level={2} style={{ marginBottom: 30 }}>Chỉnh sửa câu hỏi</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          Cập nhật thông tin chi tiết cho câu hỏi của bạn.
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
              {
                validator: (_, value) => {
                  if (!value || value.trim() === '' || value === '<p><br></p>') {
                    return Promise.reject(new Error('Vui lòng nhập nội dung chi tiết!'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <EditorWithCounter 
              placeholder="Mô tả chi tiết vấn đề, những gì bạn đã thử và kết quả mong muốn..." 
              modules={modules}
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
              icon={<EditOutlined />} 
              loading={loading}
              block
            >
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditQuestion;
