// Tạo file utils/axiosConfig.ts
import message from 'antd/es/message';
import axios from 'axios';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor để tự động thêm token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor xử lý lỗi 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      window.location.href = '/login';
      message.error('Vui lòng đăng nhập lại!');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;