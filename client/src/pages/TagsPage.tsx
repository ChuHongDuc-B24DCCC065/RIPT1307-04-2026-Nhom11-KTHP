import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Input, Tag, Space, Skeleton, Empty, Button } from 'antd';
import { SearchOutlined, CalendarOutlined, ArrowLeftOutlined, NumberOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text, Paragraph } = Typography;

interface TagItem {
  id: number;
  name: string;
  description: string;
  created_at: string;
  question_count: number;
}

const TagsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/questions/tags/list`);
      if (res.data?.success) {
        setTags(res.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách tag:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 8px 40px 8px' }}>
      
      {/* Quay lại trang chủ */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        type="text"
        className="transition-all"
        style={{ 
          marginBottom: 20, 
          fontWeight: 600, 
          color: '#64748b',
          paddingLeft: 4,
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px'
        }}
      >
        Quay lại trang chủ
      </Button>

      {/* Header trang */}
      <div style={{ marginBottom: 36 }}>
        <Title level={2} style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
          Thẻ câu hỏi (Tags)
        </Title>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0', maxWidth: '750px' }}>
          Một thẻ là một từ khóa hoặc nhãn giúp phân loại câu hỏi của bạn với các câu hỏi tương tự khác. 
          Sử dụng các thẻ phù hợp giúp người khác dễ dàng tìm và trả lời câu hỏi của bạn hơn.
        </p>

        {/* Ô tìm kiếm tag */}
        <Input
          size="large"
          placeholder="Tìm kiếm thẻ theo tên hoặc mô tả..."
          prefix={<SearchOutlined style={{ color: '#94a3b8', marginRight: '6px' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            borderRadius: '14px', 
            height: '46px', 
            maxWidth: '420px',
            border: '1px solid #e2e8f0', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            fontSize: '14.5px'
          }}
          allowClear
        />
      </div>

      {/* Grid danh sách thẻ */}
      {loading ? (
        <Row gutter={[20, 20]}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Col xs={24} sm={12} md={8} key={idx}>
              <Card style={{ borderRadius: '20px' }}>
                <Skeleton active paragraph={{ rows: 3 }} title={{ width: 120 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredTags.length === 0 ? (
        <Card style={{ borderRadius: '20px', textAlign: 'center', padding: '40px' }}>
          <Empty description={searchQuery ? "Không tìm thấy thẻ nào phù hợp!" : "Chưa có thẻ nào trong hệ thống!"} />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {filteredTags.map(tag => (
            <Col xs={24} sm={12} md={8} key={tag.id}>
              <Card 
                className="premium-card animated-hover-card"
                style={{ 
                  borderRadius: '20px', 
                  height: '100%',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '4px'
                }}
                styles={{ 
                  body: {
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between'
                  }
                }}
              >
                <div>
                  {/* Tag Name & Count */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Tag 
                      color="purple" 
                      style={{ 
                        cursor: 'pointer', 
                        borderRadius: '6px', 
                        padding: '4px 12px', 
                        fontSize: '13.5px',
                        fontWeight: 600,
                        backgroundColor: '#f3e8ff',
                        color: '#7c3aed',
                        border: 'none',
                        margin: 0
                      }}
                      onClick={() => navigate(`/search?tag=${tag.name.toLowerCase()}`)}
                    >
                      #{tag.name}
                    </Tag>
                    <Space size={4} style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                      <NumberOutlined style={{ fontSize: 11, color: '#6366f1' }} />
                      <Text strong style={{ fontSize: '12px', color: '#1e293b' }}>
                        {tag.question_count}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '11px' }}>câu hỏi</Text>
                    </Space>
                  </div>

                  {/* Description */}
                  <Paragraph 
                    ellipsis={{ rows: 3 }}
                    style={{ 
                      color: '#475569', 
                      fontSize: '13.5px', 
                      lineHeight: '1.6', 
                      marginBottom: 16,
                      minHeight: '64px'
                    }}
                  >
                    {tag.description}
                  </Paragraph>
                </div>

                {/* Footer of Card */}
                <div style={{ 
                  borderTop: '1px dashed #f1f5f9', 
                  paddingTop: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginTop: 'auto'
                }}>
                  <Space size="small" style={{ color: '#94a3b8', fontSize: '11.5px' }}>
                    <CalendarOutlined />
                    <span>Tạo: {dayjs(tag.created_at).format('DD/MM/YYYY')}</span>
                  </Space>
                  
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => navigate(`/search?tag=${tag.name.toLowerCase()}`)}
                    style={{ 
                      color: '#6366f1', 
                      fontWeight: 600, 
                      padding: 0,
                      fontSize: '12.5px'
                    }}
                  >
                    Xem câu hỏi →
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default TagsPage;
