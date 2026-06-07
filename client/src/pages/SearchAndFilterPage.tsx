import React, { useState, useEffect } from 'react';
import { Tag, Card, Typography, message, Empty, Skeleton, Input, Popover, Button, Avatar, Select, Radio, Badge, Col, Row, Space } from 'antd';
import { CheckOutlined, FilterOutlined, ClearOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import dayjs from 'dayjs';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getAvatarGradient } from '../utils/avatar';
import { stripHtml } from '../utils/html';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title } = Typography;

// --- Interface định nghĩa kiểu dữ liệu trả về từ API ---
interface Question {
  id: number;
  title: string;
  description: string;
  tags: string;
  author: string;
  user_id: number;
  votes: number;
  answer_count?: number;
  created_at: string;
  user_vote_type?: number;
  author_role?: string;
  is_announcement?: number;
  post_type?: string;
  deadline?: string;
  attachment_url?: string;
  attachment_name?: string;
  views?: number;
  author_reputation?: number;
}

const SearchAndFilterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');

  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const tagsParam = searchParams.get('tags') || '';
  const searchIn = searchParams.get('searchIn') || 'both';
  const dateRange = searchParams.get('dateRange') || 'all';

  // State to control filter panel visibility
  const [showFilters, setShowFilters] = useState(() => {
    const hasSearchIn = searchParams.has('searchIn') && searchParams.get('searchIn') !== 'both';
    const hasDateRange = searchParams.has('dateRange') && searchParams.get('dateRange') !== 'all';
    const hasTags = searchParams.has('tags') || searchParams.has('tag');
    return hasSearchIn || hasDateRange || hasTags;
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedQuestions, setLikedQuestions] = useState<Record<number, boolean>>({});
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [tagsData, setTagsData] = useState<Record<string, { description: string; count: number }>>({});
  
  const [watchedTags, setWatchedTags] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCHED_TAGS) || '[]');
    } catch {
      return [];
    }
  });

  // Combine tag (clicked from other pages) and tagsParam (selected from dropdown)
  const selectedTags = React.useMemo(() => {
    const list: string[] = [];
    if (tag) {
      list.push(tag.toLowerCase());
    }
    if (tagsParam) {
      tagsParam.split(',').forEach(t => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned && !list.includes(cleaned)) {
          list.push(cleaned);
        }
      });
    }
    return list;
  }, [tag, tagsParam]);

  const activeFiltersCount = 
    selectedTags.length + 
    (dateRange !== 'all' ? 1 : 0) + 
    (searchIn !== 'both' ? 1 : 0);

  const toggleWatchTag = (tagName: string) => {
    const isWatched = watchedTags.includes(tagName.toLowerCase());
    let updated;
    if (isWatched) {
      updated = watchedTags.filter(t => t !== tagName.toLowerCase());
      message.success(`Đã bỏ theo dõi thẻ #${tagName}`);
    } else {
      updated = [...watchedTags, tagName.toLowerCase()];
      message.success(`Đã theo dõi thẻ #${tagName}`);
    }
    setWatchedTags(updated);
    localStorage.setItem(STORAGE_KEYS.WATCHED_TAGS, JSON.stringify(updated));
  };

  const fetchTagCounts = async () => {
    try {
      const res = await axiosInstance.get('/questions/tags/stats');
      if (res.data?.success) {
        setTagCounts(res.data.data || {});
      }

      const resList = await axiosInstance.get('/questions/tags/list');
      if (resList.data?.success) {
        const data: Record<string, { description: string; count: number }> = {};
        resList.data.data.forEach((t: any) => {
          data[t.name.toLowerCase()] = {
            description: t.description,
            count: t.question_count
          };
        });
        setTagsData(data);
      }
    } catch (error) {
      console.error('Lỗi lấy thống kê tags:', error);
    }
  };

  const tagOptions = React.useMemo(() => {
    const keys = new Set([...Object.keys(tagsData), ...Object.keys(tagCounts)]);
    return Array.from(keys).map(key => {
      const info = tagsData[key];
      const count = info?.count || tagCounts[key] || 0;
      return {
        label: `#${key} (${count})`,
        value: key,
      };
    });
  }, [tagsData, tagCounts]);

  const getTagInfo = (tagName: string) => {
    const key = tagName.toLowerCase();
    const info = tagsData[key];
    return {
      description: info?.description || 'Không có mô tả cho thẻ này.',
      count: info?.count || tagCounts[key] || 0
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
  };

  // getAvatarGradient được import từ utils/avatar

  // Fetch tags stats once on mount
  useEffect(() => {
    fetchTagCounts();
  }, []);

  // Fetch search results reactive to query and filters
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const hasFilter = query || tag || tagsParam || dateRange !== 'all';
        if (!hasFilter) {
          setQuestions([]);
          setLoading(false);
          return;
        }

        const apiParams = new URLSearchParams();
        if (query) {
          apiParams.set('search', query);
          if (searchIn && searchIn !== 'both') {
            apiParams.set('searchIn', searchIn);
          }
        }
        if (tagsParam) {
          apiParams.set('tags', tagsParam);
        } else if (tag) {
          apiParams.set('tag', tag);
        }
        if (dateRange && dateRange !== 'all') {
          apiParams.set('dateRange', dateRange);
        }

        const res = await axiosInstance.get(`/questions?${apiParams.toString()}`);
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setQuestions(data);

        const initialLikes: Record<number, boolean> = {};
        data.forEach((q: Question) => {
          if (q.user_vote_type === 1) {
            initialLikes[q.id] = true;
          }
        });
        setLikedQuestions(initialLikes);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        message.error('Không thể lấy kết quả!');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, tag, tagsParam, searchIn, dateRange]);

  const handleSearch = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set('q', value.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleTagsChange = (newTags: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    if (newTags.length > 0) {
      newParams.set('tags', newTags.join(','));
    } else {
      newParams.delete('tags');
    }
    setSearchParams(newParams);
  };

  const handleSearchInChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'both') {
      newParams.set('searchIn', value);
    } else {
      newParams.delete('searchIn');
    }
    setSearchParams(newParams);
  };

  const handleDateRangeChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set('dateRange', value);
    } else {
      newParams.delete('dateRange');
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    const newParams = new URLSearchParams();
    if (query) {
      newParams.set('q', query);
    }
    setSearchParams(newParams);
  };

  const handleLike = async (e: React.MouseEvent, question: Question) => {
    e.stopPropagation(); 
    if (!user) {
      message.warning('Bạn cần đăng nhập để thích câu hỏi!');
      navigate('/login');
      return;
    }

    const isLiked = !!likedQuestions[question.id];
    
    // Cập nhật giao diện lập tức (Optimistic UI update)
    setLikedQuestions(prev => ({ ...prev, [question.id]: !isLiked }));
    setQuestions(prev => prev.map(q => 
      q.id === question.id 
        ? { ...q, votes: (q.votes || 0) + (isLiked ? -1 : 1) } 
        : q
    ));

    try {
      const res = await axiosInstance.post(`/questions/${question.id}/vote`, { type: 'up' });
      
      // Cập nhật lại state chuẩn xác từ backend trả về
      setLikedQuestions(prev => ({ ...prev, [question.id]: res.data.user_vote_type === 1 }));
      setQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { ...q, votes: res.data.votes } 
          : q
      ));
    } catch (error) {
      // Phục hồi lại trạng thái nếu gọi API lỗi
      setLikedQuestions(prev => ({ ...prev, [question.id]: isLiked }));
      setQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { ...q, votes: (q.votes || 0) + (isLiked ? 1 : -1) } 
          : q
      ));
      message.error('Lỗi khi thực hiện thao tác Thích!');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 8px' }}>
      <Input.Search
        key={query}
        placeholder="Nhập từ khóa tìm kiếm..."
        allowClear
        enterButton="Tìm kiếm"
        size="large"
        defaultValue={query || ''}
        onSearch={handleSearch}
        style={{ 
          borderRadius: '14px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          fontSize: '15px',
          marginBottom: 20,
          overflow: 'hidden'
        }}
      />

      {/* Advanced Filters Trigger Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Badge count={activeFiltersCount} offset={[8, 0]} color="#6366f1">
            <Button 
              type={showFilters ? "primary" : "default"}
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              style={{ borderRadius: '8px', fontWeight: 500 }}
            >
              Bộ lọc nâng cao {showFilters ? <UpOutlined /> : <DownOutlined />}
            </Button>
          </Badge>
          {activeFiltersCount > 0 && (
            <Button 
              type="text" 
              danger 
              icon={<ClearOutlined />} 
              onClick={handleResetFilters}
              style={{ fontWeight: 500 }}
            >
              Đặt lại bộ lọc
            </Button>
          )}
        </Space>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <Card 
          style={{ 
            marginBottom: 28, 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}
          styles={{ body: { padding: '20px' } }}
        >
          <Row gutter={[20, 16]}>
            <Col xs={24} md={12}>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: 8 }}>Tìm kiếm trong:</div>
              <Radio.Group 
                value={searchIn} 
                onChange={(e) => handleSearchInChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                style={{ width: '100%' }}
              >
                <Radio.Button value="both" style={{ width: '33.33%', textAlign: 'center' }}>Cả hai</Radio.Button>
                <Radio.Button value="title" style={{ width: '33.33%', textAlign: 'center' }}>Tiêu đề</Radio.Button>
                <Radio.Button value="content" style={{ width: '33.33%', textAlign: 'center' }}>Nội dung</Radio.Button>
              </Radio.Group>
            </Col>

            <Col xs={24} md={12}>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: 8 }}>Thời gian đăng bài:</div>
              <Select 
                value={dateRange} 
                onChange={handleDateRangeChange}
                style={{ width: '100%' }}
                options={[
                  { label: 'Tất cả thời gian', value: 'all' },
                  { label: 'Hôm nay', value: 'today' },
                  { label: '7 ngày qua', value: 'week' },
                  { label: '30 ngày qua', value: 'month' },
                  { label: '1 năm qua', value: 'year' }
                ]}
              />
            </Col>

            <Col xs={24}>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: 8 }}>Lọc theo thẻ (Tags):</div>
              <Select 
                mode="multiple"
                allowClear
                placeholder="Chọn một hoặc nhiều thẻ để lọc..."
                value={selectedTags}
                onChange={handleTagsChange}
                style={{ width: '100%' }}
                options={tagOptions}
                filterOption={(input, option) => 
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Col>
          </Row>
        </Card>
      )}

      <Title level={3} style={{ marginBottom: 20 }}>
        {query ? (
          <>
            Kết quả tìm kiếm cho: "{query}"
            {selectedTags.length > 0 && (
              <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 'normal', marginLeft: 8 }}>
                (Thẻ: {selectedTags.map(t => `#${t}`).join(', ')})
              </span>
            )}
          </>
        ) : selectedTags.length > 0 ? (
          `Các câu hỏi thuộc thẻ: ${selectedTags.map(t => `#${t}`).join(', ')}`
        ) : (
          'Tìm kiếm câu hỏi'
        )}
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
        <div className="so-questions-list-container">
          {questions.map((item) => {
            const tagList = item.tags
              ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
              : [];
            return (
              <div className="so-question-item" key={item.id}>
                {/* Left: Stats Column */}
                <div className="so-stats-container">
                  <div 
                    className={`so-stat-item votes ${likedQuestions[item.id] ? 'vote-btn-active' : ''}`}
                    onClick={(e) => handleLike(e, item)}
                    style={{ 
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: likedQuestions[item.id] ? '#e6f7ff' : 'transparent',
                      color: likedQuestions[item.id] ? '#1890ff' : '#334155',
                      transition: 'all 0.2s'
                    }}
                    title="Bấm để Thích/Bỏ Thích"
                  >
                    {formatNumber(item.votes ?? 0)} votes
                  </div>
                  
                  <div className={`so-stat-item answers ${item.answer_count && item.answer_count > 0 ? 'has-accepted' : ''}`}>
                    {item.answer_count && item.answer_count > 0 && <CheckOutlined style={{ marginRight: '4px' }} />}
                    {formatNumber(item.answer_count ?? 0)} answers
                  </div>
                  
                  <div className="so-stat-item views">
                    {formatNumber(item.views ?? 0)} views
                  </div>
                </div>

                {/* Right: Content Column */}
                <div className="so-content-container">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <a
                      href={`/questions/${item.id}`}
                      className="so-question-title"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/questions/${item.id}`);
                      }}
                      style={{ marginBottom: 0 }}
                    >
                      {item.title}
                    </a>
                    {(item.is_announcement === 1 || item.post_type === 'announcement') && (
                      <Tag color="gold" style={{ borderRadius: 5, fontWeight: 600, fontSize: 10, padding: '0 6px', margin: 0 }}>📢 Thông báo</Tag>
                    )}
                    {item.post_type === 'assignment' && (
                      <Tag color="volcano" style={{ borderRadius: 5, fontWeight: 600, fontSize: 10, padding: '0 6px', margin: 0 }}>
                        📝 Bài tập {item.deadline ? `(Hạn nộp: ${dayjs(item.deadline).format('DD/MM HH:mm')})` : ''}
                      </Tag>
                    )}
                    {item.post_type === 'material' && (
                      <Tag color="cyan" style={{ borderRadius: 5, fontWeight: 600, fontSize: 10, padding: '0 6px', margin: 0 }}>📚 Tài liệu học tập</Tag>
                    )}
                  </div>

                  <div className="so-question-excerpt">
                    {item.description && (stripHtml(item.description).length > 180
                      ? `${stripHtml(item.description).substring(0, 180)}...`
                      : stripHtml(item.description))}
                  </div>

                  <div className="so-meta-row">
                    <div className="so-tags-list" onClick={(e) => e.stopPropagation()}>
                      {tagList.map(tag => {
                        const info = getTagInfo(tag);
                        const isWatched = watchedTags.includes(tag.toLowerCase());
                        return (
                          <Popover
                            key={tag}
                            trigger="hover"
                            placement="top"
                            content={
                              <div style={{ width: 280, padding: '4px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <div>
                                    <div className="so-popover-tag-title">{tag.toLowerCase()}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: 2 }}>
                                      <strong>{formatNumber(info.count)}</strong> questions
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, minHeight: '36px' }}>
                                    {info.description}
                                  </div>
                                  <Button 
                                    type={isWatched ? "default" : "primary"} 
                                    size="middle" 
                                    block
                                    style={{ 
                                      borderRadius: 8, 
                                      fontWeight: 600,
                                      height: '38px',
                                      boxShadow: isWatched ? 'none' : '0 2px 4px rgba(22, 119, 255, 0.2)'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleWatchTag(tag);
                                    }}
                                  >
                                    {isWatched ? 'Đang theo dõi' : 'Watch tag'}
                                  </Button>
                                </div>
                              </div>
                            }
                          >
                            <Tag 
                              className="so-tag"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/search?tag=${tag.toLowerCase()}`);
                              }}
                            >
                              {tag.toLowerCase()}
                            </Tag>
                          </Popover>
                        );
                      })}
                    </div>

                    <div className="so-user-box" onClick={(e) => e.stopPropagation()}>
                      <Avatar 
                        size={18} 
                        style={{ 
                          background: getAvatarGradient(item.author),
                          fontWeight: 600,
                          fontSize: '9px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {(item.author || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <span 
                        className="so-username"
                        onClick={() => navigate(`/profile?id=${item.user_id}`)}
                      >
                        {item.author || 'Ẩn danh'}
                      </span>
                      {item.author_role === 'teacher' && (
                        <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginRight: '2px' }}>👨‍🏫 GV</span>
                      )}
                      <span className="so-reputation" title="Điểm uy tín">
                        {item.author_reputation ?? 100}
                      </span>
                      <span className="so-time">
                        hỏi {item.created_at ? dayjs(item.created_at).fromNow() : 'vừa xong'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilterPage;
