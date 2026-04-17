import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiClient, ApiError } from '../api/client';
import PageLoading from '../components/PageLoading';

export type Role = 'Client' | 'Master' | 'Admin';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthResponse {
  accessToken: string;
}

interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<void>;
  register(displayName: string, email: string, password: string): Promise<void>;
  logout(): void;
  init(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [initialized, setInitialized] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const init = async () => {
    const currentToken = localStorage.getItem('token');

    if (!currentToken) {
      setToken(null);
      setUser(null);
      setRole(null);
      return;
    }

    setToken(currentToken);

    try {
      const me = await apiClient.get<MeResponse>('/api/auth/me');
      setUser({
        id: me.id,
        email: me.email,
        displayName: me.displayName,
      });
      setRole(me.role);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }

      if (error instanceof TypeError) {
        logout();
        return;
      }

      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });

    localStorage.setItem('token', response.accessToken);
    setToken(response.accessToken);
    await init();
  };

  const register = async (displayName: string, email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', {
      displayName,
      email,
      password,
    });

    localStorage.setItem('token', response.accessToken);
    setToken(response.accessToken);
    await init();
  };

  useEffect(() => {
    init().finally(() => setInitialized(true));
  }, []);

  if (!initialized) {
    return <PageLoading />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        init,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}