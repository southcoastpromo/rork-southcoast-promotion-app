import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { setAdminAuthToken } from '../lib/trpc';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const login = useCallback(async (token: string): Promise<boolean> => {
    const trimmed = token.trim();
    if (trimmed.length === 0) {
      return false;
    }
    setIsAdmin(true);
    setAdminToken(trimmed);
    setAdminAuthToken(trimmed);
    return true;
  }, []);

  const logout = useCallback(async () => {
    setIsAdmin(false);
    setAdminToken(null);
    setAdminAuthToken(null);
  }, []);

  return useMemo(() => ({
    isAdmin,
    isLoading: false,
    login,
    logout,
    adminToken,
  }), [isAdmin, login, logout, adminToken]);
});
