import React from 'react';
import { Navigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface Props {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  const user = userData ? JSON.parse(userData) : null;

  // Nếu chưa đăng nhập -> Đá về trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có yêu cầu role mà user không khớp -> Đá về trang chủ
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;