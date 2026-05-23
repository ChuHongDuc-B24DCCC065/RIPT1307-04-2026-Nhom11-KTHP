import React, { useState, useEffect } from 'react';
import { List, Tag, Space, Card, Typography, message, Empty, Skeleton, Input } from 'antd';
import { MessageOutlined, LikeOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

// --- Interface định nghĩa kiểu dữ liệu trả về từ API ---
interface Question {
  id: number;
  title: string;
  description: string;
  tags: string;
  author: string;
  votes: number;
  answer_count: number;
  created_at: string;
}

// --- Helper: Format thời gian tương đối ---
const formatTime = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff} giây trước`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

const SearchAndFilterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q');
  const tag = searchParams.get('tag');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (query) {
          endpoint = `/questions?search=${encodeURIComponent(query)}`;
        } else if (tag) {
          endpoint = `/questions?tag=${encodeURIComponent(tag)}`;
        } else {
          setQuestions([]);
          setLoading(false);
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}`);
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setQuestions(data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        message.error('Không thể lấy kết quả!');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, tag]);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Input.Search
        placeholder="Nhập từ khóa tìm kiếm..."
        allowClear
        enterButton="Tìm kiếm"
        size="large"
        defaultValue={query || ''}
        onSearch={handleSearch}
        style={{ marginBottom: 24 }}
      />

      <Title level={3} style={{ marginBottom: 20 }}>
        {query && `Kết quả tìm kiếm cho: "${query}"`}
        {tag && `Các câu hỏi thuộc thẻ: #${tag}`}
        {!query && !tag && 'Tìm kiếm câu hỏi'}
      </Title>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} style={{ marginBottom: 16 }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        ))
      ) : questions.length === 0 ? (
        <Card>
          <Empty description="Không tìm thấy câu hỏi nào phù hợp." />
        </Card>
      ) : (
        <List
          itemLayout="vertical"
          size="large"
          dataSource={questions}
          renderItem={(item) => {
            const tagList = item.tags
              ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
              : [];
            return (
              <Card
                hoverable
                key={item.id}
                style={{ marginBottom: 16 }}
                onClick={() => navigate(`/questions/${item.id}`)}
              >
                <List.Item
                  actions={[
                    <Space key="votes"><LikeOutlined /> {item.votes ?? 0} Votes</Space>,
                    <Space key="answers"><MessageOutlined /> {item.answer_count ?? 0} Trả lời</Space>,
                    <Space key="time"><ClockCircleOutlined /> {item.created_at ? formatTime(item.created_at) : 'Vừa xong'}</Space>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <a
                        href={`/questions/${item.id}`}
                        style={{ fontSize: 18, fontWeight: 600 }}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/questions/${item.id}`);
                        }}
                      >
                        {item.title}
                      </a>
                    }
                    description={
                      <Space>
                        <UserOutlined />
                        <Text type="secondary">{item.author || 'Ẩn danh'}</Text>
                      </Space>
                    }
                  />
                  <div style={{ marginBottom: 12, color: '#555' }}>
                    {item.description && item.description.length > 150
                      ? `${item.description.substring(0, 150)}...`
                      : item.description}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    {tagList.map(t => (
                      <Tag 
                        color="geekblue" 
                        key={t} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/search?tag=${t}`)}
                      >
                        #{t}
                      </Tag>
                    ))}
                  </div>
                </List.Item>
              </Card>
            );
          }}
        />
      )}
    </div>
  );
};

export default SearchAndFilterPage;
