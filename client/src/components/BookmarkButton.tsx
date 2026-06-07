import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { BookOutlined, BookFilled } from '@ant-design/icons';
import axiosInstance from '../utils/axiosConfig';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useNavigate } from 'react-router-dom';

interface BookmarkButtonProps {
  questionId: string | number;
  style?: React.CSSProperties;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ questionId, style }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
  const userId = user ? user.id : null;
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (!userId || !token) return;
      try {
        const res = await axiosInstance.get(`/questions/${questionId}/bookmark-status`);
        setIsBookmarked(res.data.isBookmarked);
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái bookmark', error);
      }
    };
    fetchBookmarkStatus();
  }, [questionId, userId, token]);

  const handleBookmark = async () => {
    if (!userId) {
      message.warning('Bạn cần đăng nhập để đánh dấu câu hỏi!');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/questions/${questionId}/bookmark`, {});
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
