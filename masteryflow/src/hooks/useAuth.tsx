import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MASTER_PASSWORD = import.meta.env.VITE_MASTER_PASSWORD || 'masteryflow2025';
const AUTH_TOKEN_KEY = 'masteryflow_auth_token';
const AUTH_TOKEN = 'masteryflow_token_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    setIsAuthenticated(token === AUTH_TOKEN);
    setIsLoading(false);
  }, []);

  const login = async (password: string) => {
    // Simulate async auth (in real scenario, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === MASTER_PASSWORD) {
      localStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN);
      setIsAuthenticated(true);
    } else {
      throw new Error('Invalid password');
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
