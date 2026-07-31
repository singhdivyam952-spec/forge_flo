import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import apiClient, { AUTH_EXPIRED_EVENT, getAccessToken, setAccessToken, getErrorMessage } from '../api/client';
import type { ApiResponse, LoginResponseData, User } from '../types/api';
import { hasUserPermission } from '../utils/access';

const USER_STORAGE_KEY = 'forgeflo.user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    persistUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    const nextUser = response.data.data.user;
    setUser(nextUser);
    persistUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (getAccessToken()) {
        try {
          await refreshUser();
        } catch {
          if (!cancelled) clearSession();
        }
      }
      if (!cancelled) setIsInitializing(false);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleExpired = () => clearSession();
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', {
        email,
        password,
      });
      const { user: loggedInUser, accessToken } = response.data.data;
      setAccessToken(accessToken);
      setUser(loggedInUser);
      persistUser(loggedInUser);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login failed'));
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // best-effort logout; clear local session regardless
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasPermission = useCallback(
    (permission: string) => {
      return hasUserPermission(user, permission);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      isLoggingIn,
      login,
      logout,
      hasPermission,
      refreshUser,
    }),
    [user, isInitializing, isLoggingIn, login, logout, hasPermission, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
