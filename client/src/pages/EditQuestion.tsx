import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space, Spin, DatePicker, Upload } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UploadOutlined, PaperClipOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [postType, setPostType] = useState('question');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/${id}`);
        // server trả về data nằm trực tiếp trong response hoặc qua key data
        const question = res.data.data || res.data;

        // Lấy thông tin user từ localStorage
        const userDataString = localStorage.getItem('user');
        if (!userDataString) {
          message.error("Vui lòng đăng nhập để thực hiện chức năng này!");
          navigate('/login');
          return;
        }

        const userObj = JSON.parse(userDataString);
        setCurrentUser(userObj);

        // Kiểm tra quyền sở hữu
        const questionUserId = question.user_id || (question.user && question.user.id) || (question.user && question.user._id);
        const currentUserId = userObj.id || userObj._id;

        if (questionUserId && questionUserId !== currentUserId && userObj.role !== 'admin') {
          message.error("Bạn không có quyền chỉnh sửa câu hỏi này!");
          navigate('/');
          return;
        }

        // Xử lý chuỗi tags
        let processedTags = question.tags;
        if (typeof question.tags === 'string') {
          processedTags = question.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
        } else if (!Array.isArray(question.tags)) {
           processedTags = [];
        }

        form.setFieldsValue({
          title: question.title,
          description: question.description,
          tags: processedTags,
          post_type: question.post_type || 'question',
          deadline: question.deadline ? dayjs(question.deadline) : null
        });
        setPostType(question.post_type || 'question');
        setAttachmentUrl(question.attachment_url || null);
        setAttachmentName(question.attachment_name || null);

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
        tags: values.tags,
        post_type: currentUser?.role === 'teacher' ? values.post_type : 'question',
        deadline: currentUser?.role === 'teacher' && values.post_type === 'assignment' ? values.deadline : null,
        attachment_url: currentUser?.role === 'teacher' ? attachmentUrl : null,
        attachment_name: currentUser?.role === 'teacher' ? attachmentName : null
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.status === 200 || res.status === 204) {
        message.success("Cập nhật câu hỏi thành công!");
        navigate(`/questions/${id}`);
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
          onValuesChange={(changedValues) => {
            if (changedValues.post_type) {
              setPostType(changedValues.post_type);
            }
          }}
        >
          {currentUser?.role === 'teacher' && (
            <>
              <Form.Item
                name="post_type"
                label="Loại bài đăng"
                rules={[{ required: true, message: 'Vui lòng chọn loại bài viết!' }]}
              >
                <Select size="large" style={{ width: '100%' }}>
                  <Select.Option value="question">❓ Câu hỏi thảo luận (Thảo luận chung)</Select.Option>
                  <Select.Option value="announcement">📢 Thông báo học vụ (Ghim lên đầu)</Select.Option>
                  <Select.Option value="assignment">📝 Bài tập / Câu hỏi ôn tập (Có hạn nộp)</Select.Option>
                  <Select.Option value="material">📚 Tài liệu tham khảo (Chia sẻ slide, slide bài giảng)</Select.Option>
                </Select>
              </Form.Item>

              {postType === 'assignment' && (
                <Form.Item
                  name="deadline"
                  label="Hạn chót nộp bài (Deadline)"
                  rules={[{ required: true, message: 'Vui lòng chọn hạn chót nộp bài!' }]}
                >
                  <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" size="large" style={{ width: '100%' }} />
                </Form.Item>
              )}

              {/* Đính kèm tài liệu học vụ */}
              <Form.Item
                label="Đính kèm tài liệu / Thông báo học vụ"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Upload
                    name="file"
                    action={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/document`}
                    headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                    showUploadList={false}
                    onChange={(info) => {
                      if (info.file.status === 'uploading') {
                        setUploading(true);
                      }
                      if (info.file.status === 'done') {
                        setUploading(false);
                        if (info.file.response?.success) {
                          setAttachmentUrl(info.file.response.fileUrl);
                          setAttachmentName(info.file.response.fileName);
                          message.success('Đính kèm tài liệu thành công!');
                        } else {
                          message.error(info.file.response?.message || 'Tải file lên thất bại!');
                        }
                      } else if (info.file.status === 'error') {
                        setUploading(false);
                        message.error('Tải file lên thất bại! Vui lòng kiểm tra định dạng hoặc dung lượng file.');
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading} disabled={uploading}>
                      Chọn file đính kèm
                    </Button>
                  </Upload>
                  
                  {attachmentUrl && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginTop: '4px'
                    }}>
                      <span style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PaperClipOutlined style={{ color: '#4f46e5' }} />
                        {attachmentName}
                      </span>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        size="small"
                        onClick={() => {
                          setAttachmentUrl(null);
                          setAttachmentName(null);
                          message.info('Đã gỡ file đính kèm.');
                        }}
                      />
                    </div>
                  )}
                </div>
              </Form.Item>
            </>
          )}
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
