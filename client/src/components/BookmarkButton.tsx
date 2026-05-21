import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { BookOutlined, BookFilled } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface BookmarkButtonProps {
  questionId: string | number;
  style?: React.CSSProperties;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ questionId, style }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (!user || !token) return;
      try {
        const res = await axios.get(`${API}/questions/${questionId}/bookmark-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsBookmarked(res.data.isBookmarked);
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái bookmark', error);
      }
    };
    fetchBookmarkStatus();
  }, [questionId, user, token]);

  const handleBookmark = async () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đánh dấu câu hỏi!');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/questions/${questionId}/bookmark`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsBookmarked(res.data.isBookmarked);
      message.success(res.data.message);
    } catch {
      message.error('Không thể thay đổi trạng thái đánh dấu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={isBookmarked ? <BookFilled style={{ color: '#faad14' }} /> : <BookOutlined />}
      size="large"
      type="text"
      onClick={handleBookmark}
      loading={loading}
      title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi'}
      style={style}
    />
  );
};

export default BookmarkButton;
