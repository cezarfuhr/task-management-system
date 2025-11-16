'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../lib/auth-store';

export function useAuth() {
  const { user, isAuthenticated, accessToken, refreshToken, setAuth, logout, updateUser } =
    useAuthStore();

  // Update localStorage userId for tRPC headers
  useEffect(() => {
    if (user) {
      localStorage.setItem('userId', user.id);
      localStorage.setItem('accessToken', accessToken || '');
    } else {
      localStorage.removeItem('userId');
      localStorage.removeItem('accessToken');
    }
  }, [user, accessToken]);

  return {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    setAuth,
    logout,
    updateUser,
  };
}
