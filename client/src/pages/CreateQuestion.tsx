import React, { useState, useMemo } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Select, 
  message, 
  Tag, 
  ConfigProvider, 
  Alert
} from 'antd';
import { 
  SafetyCertificateOutlined,
  PlusOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'react-quill-new/dist/quill.snow.css';
import './CreateQuestion.css';

const CreateQuestion: React.FC = () => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setSelectedTags] = useState<string[]>(['React', 'Frontend']);
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
        if (res.data.data && res.data.data.status === 'pending') {
          message.warning(res.data.message || "Bài viết của bạn đang chờ phê duyệt vì điểm uy tín chưa đủ.", 5);
        } else {
          message.success(res.data.message || "Đăng câu hỏi thành công!");
        }
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

  // Bộ chọn tag gợi ý
  const suggestionTags = ['Tailwind CSS', 'Frontend', 'UI/UX', 'JavaScript'];

  const handleSuggestionClick = (tag: string) => {
    const currentTags = form.getFieldValue('tags') || [];
    if (currentTags.includes(tag)) {
      return; // Đã chọn rồi thì không thêm nữa
    }
    if (currentTags.length >= 5) {
      message.warning('Bạn chỉ được chọn tối đa 5 thẻ!');
      return;
    }
    const newTags = [...currentTags, tag];
    form.setFieldsValue({ tags: newTags });
    setSelectedTags(newTags);
  };

  const modules = {
    toolbar: [
      ['bold', 'italic'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image']
    ],
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#a855f7', // Sắc tím quyến rũ đồng bộ mockup
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          fontFamily: 'inherit',
        }
      }}
    >
      <div className="create-question-container">
        <div className="create-question-wrapper">
          
          {parsedUser && (
            <Alert 
              message={
                <span className="verification-banner-text">
                  <b>Trạng thái đăng nhập đã xác thực.</b> Chào mừng bạn quay trở lại, {username}. Bạn có thể đăng bài ngay bây giờ.
                </span>
              } 
              type="success" 
              showIcon 
              icon={<SafetyCertificateOutlined className="verification-banner-text" />} 
              className="verification-banner"
            />
          )}

          <Card variant="borderless" className="create-question-card">
            <div className="create-question-header">
              <h1 className="create-question-title">Tạo bài viết mới</h1>
              <p className="create-question-subtitle">Chia sẻ kiến thức hoặc đặt câu hỏi cho cộng đồng.</p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              initialValues={{ tags: ['React', 'Frontend'] }}
              onValuesChange={(changedValues) => {
                if (changedValues.tags) {
                  setSelectedTags(changedValues.tags);
                }
              }}
            >
              {/* Tiêu đề câu hỏi */}
              <Form.Item
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề câu hỏi' }]}
                label={
                  <span className="create-question-label">
                    Tiêu đề câu hỏi <span className="create-question-required-star">*</span>
                  </span>
                }
              >
                <Input 
                  className="create-question-input"
                  placeholder="Làm thế nào để tối ưu hiệu suất React component?" 
                />
              </Form.Item>

              {/* Nội dung chi tiết */}
              <Form.Item
                required
                label={
                  <span className="create-question-label">
                    Nội dung chi tiết <span className="create-question-required-star">*</span>
                  </span>
                }
              >
                <div style={{ position: 'relative' }}>
                  <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    placeholder="Tôi đang gặp vấn đề với việc re-render không cần thiết khi sử dụng Context API..."
                    className="custom-quill"
                  />
                  <div className="editor-counter-badge">
                    Số từ: {wordCount} | Ký tự: {charCount}
                  </div>
                </div>
              </Form.Item>

              {/* Tag chủ đề */}
              <Form.Item
                name="tags"
                rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập ít nhất một thẻ' }]}
                label={
                  <span className="create-question-label">
                    Tag chủ đề
                  </span>
                }
              >
                <div>
                  <Select
                    className="custom-select-tags"
                    mode="tags"
                    placeholder="Chọn tối đa 5 thẻ..."
                    maxCount={5}
                    tagRender={(props) => {
                      const { label, closable, onClose } = props;
                      return (
                        <Tag
                          closable={closable}
                          onClose={onClose}
                          className="premium-tag-pill"
                        >
                          # {label}
                        </Tag>
                      );
                    }}
                    options={[
                      { value: 'React', label: 'React' },
                      { value: 'Frontend', label: 'Frontend' },
                      { value: 'TypeScript', label: 'TypeScript' },
                      { value: 'Tailwind CSS', label: 'Tailwind CSS' },
                      { value: 'UI/UX', label: 'UI/UX' },
                      { value: 'JavaScript', label: 'JavaScript' }
                    ]}
                  />

                  {/* Suggestions row matching mockup */}
                  <div className="create-question-suggestions-row">
                    <span className="suggestions-label">Gợi ý:</span>
                    {suggestionTags.map((tag) => (
                      <span
                        key={tag}
                        className="suggestion-tag-pill"
                        onClick={() => handleSuggestionClick(tag)}
                      >
                        +{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Form.Item>

              {/* Footer Actions */}
              <div className="form-footer-actions">
                <Button 
                  className="btn-premium-cancel"
                  onClick={() => navigate('/')}
                >
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  className="btn-premium-submit"
                  icon={<PlusOutlined />}
                >
                  Đăng bài
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default CreateQuestion;