import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, usersAPI } from '../services/api';
import api from '../services/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'client' | 'specialist' | 'admin';
  profile_picture?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (code: string, role: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await usersAPI.getMe();
          setUser(res.data);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authAPI.login(email, password);
    const { access_token } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    const userRes = await usersAPI.getMe();
    setUser(userRes.data);
    return userRes.data;
  };

  const loginWithGoogle = async (code: string, role: string): Promise<User> => {
    const redirect_uri = `${window.location.origin}/auth/google/callback`;
    const res = await api.post('/auth/google/token', { code, role, redirect_uri });
    const { access_token, user: googleUser } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(googleUser);
    return googleUser;
  };

  const register = async (data: any): Promise<User> => {
    await authAPI.register(data);
    return await login(data.email, data.password);
  };

  const refreshUser = async () => {
    try {
      const res = await usersAPI.getMe();
      setUser(res.data);
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, loginWithGoogle, register, logout, refreshUser,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
