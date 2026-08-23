import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginResponse } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem('cobly_token');
      if (!token) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      try {
        const data = await api.get('/users/me');
        setState({ user: data.user, isAuthenticated: true, isLoading: false });
      } catch (err) {
        localStorage.removeItem('cobly_token');
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
    bootstrap();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('cobly_token', token);
    setState({ user, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('cobly_token');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
