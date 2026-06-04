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
  Alert,
  DatePicker,
  Upload
} from 'antd';
import { 
  SafetyCertificateOutlined,
  PlusOutlined,
  UploadOutlined,
  PaperClipOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import 'react-quill-new/dist/quill.snow.css';
import './CreateQuestion.css';

const CreateQuestion: React.FC = () => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setSelectedTags] = useState<string[]>(['React', 'Frontend']);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const isAnnouncement = searchParams.get('type') === 'announcement' && parsedUser?.role === 'teacher';
  const [postType, setPostType] = useState(isAnnouncement ? 'announcement' : 'question');

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
        tags: values.tags ? values.tags.join(',') : '',
        post_type: parsedUser?.role === 'teacher' ? values.post_type : 'question',
        deadline: parsedUser?.role === 'teacher' && values.post_type === 'assignment' ? values.deadline : null,
        attachment_url: parsedUser?.role === 'teacher' ? attachmentUrl : null,
        attachment_name: parsedUser?.role === 'teacher' ? attachmentName : null
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
        setAttachmentUrl(null);
        setAttachmentName(null);
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
              <h1 className="create-question-title">{parsedUser?.role === 'teacher' ? '👨‍🏫 Đăng tải nội dung học vụ' : 'Tạo bài viết mới'}</h1>
              <p className="create-question-subtitle">{parsedUser?.role === 'teacher' ? 'Đăng thông báo, bài tập ôn tập, tài liệu học tập hoặc câu hỏi thảo luận môn học.' : 'Chia sẻ kiến thức hoặc đặt câu hỏi cho cộng đồng.'}</p>
            </div>

            {isAnnouncement && (
              <Alert
                message="Chế độ Thông báo Giảng viên"
                description="Bạn đang tạo bài thông báo của Giảng viên. Bài viết sẽ được ghim cố định trên đầu trang và hiển thị nhãn '📢 Thông báo' nổi bật."
                type="info"
                showIcon
                style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #bfdbfe' }}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              initialValues={{ tags: ['React', 'Frontend'], post_type: isAnnouncement ? 'announcement' : 'question' }}
              onValuesChange={(changedValues) => {
                if (changedValues.tags) {
                  setSelectedTags(changedValues.tags);
                }
                if (changedValues.post_type) {
                  setPostType(changedValues.post_type);
                }
              }}
            >
              {parsedUser?.role === 'teacher' && (
                <>
                  <Form.Item
                    name="post_type"
                    label={<span className="create-question-label">Loại bài đăng <span className="create-question-required-star">*</span></span>}
                    rules={[{ required: true, message: 'Vui lòng chọn loại bài viết!' }]}
                  >
                    <Select size="large" style={{ width: '100%', borderRadius: '8px' }}>
                      <Select.Option value="question">❓ Câu hỏi thảo luận (Thảo luận chung)</Select.Option>
                      <Select.Option value="announcement">📢 Thông báo học vụ (Ghim lên đầu)</Select.Option>
                      <Select.Option value="assignment">📝 Bài tập / Câu hỏi ôn tập (Có hạn nộp)</Select.Option>
                      <Select.Option value="material">📚 Tài liệu tham khảo (Chia sẻ slide, slide bài giảng)</Select.Option>
                    </Select>
                  </Form.Item>

                  {postType === 'assignment' && (
                    <Form.Item
                      name="deadline"
                      label={<span className="create-question-label">Hạn chót nộp bài (Deadline) <span className="create-question-required-star">*</span></span>}
                      rules={[{ required: true, message: 'Vui lòng chọn hạn chót nộp bài!' }]}
                    >
                      <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" size="large" style={{ width: '100%', borderRadius: '8px' }} />
                    </Form.Item>
                  )}

                  {/* Đính kèm tài liệu học vụ */}
                  <Form.Item
                    label={<span className="create-question-label">Đính kèm tài liệu / Thông báo học vụ</span>}
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