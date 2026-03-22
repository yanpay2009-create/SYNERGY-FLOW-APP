
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useApp();

  if (!isLoggedIn) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
};
