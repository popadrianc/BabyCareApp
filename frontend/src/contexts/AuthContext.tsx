import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '../services/api';
import { User } from '../types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract session_id from URL
  const extractSessionId = (url: string): string | null => {
    if (!url) return null;
    
    // Check hash fragment
    const hashMatch = url.match(/[#&]session_id=([^&]+)/);
    if (hashMatch) return hashMatch[1];
    
    // Check query params
    const queryMatch = url.match(/[?&]session_id=([^&#]+)/);
    if (queryMatch) return queryMatch[1];
    
    return null;
  };

  // Process session ID and authenticate
  const processSessionId = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const result = await authApi.exchangeSession(sessionId);
      if (result.user) {
        setUser(result.user);
      }
      
      // Clean URL (web only)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Failed to process session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for session_id in URL first (web)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const sessionId = extractSessionId(window.location.href);
          if (sessionId) {
            await processSessionId(sessionId);
            return;
          }
        }

        // Check for existing token
        const token = await authApi.getToken();
        if (token) {
          try {
            const userData = await authApi.getMe();
            setUser(userData);
          } catch {
            // Token invalid, clear it
            await authApi.removeToken();
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Handle deep links (mobile)
    if (Platform.OS !== 'web') {
      // Cold start
      Linking.getInitialURL().then((url) => {
        if (url) {
          const sessionId = extractSessionId(url);
          if (sessionId) {
            processSessionId(sessionId);
          }
        }
      });

      // Hot link
      const subscription = Linking.addEventListener('url', ({ url }) => {
        const sessionId = extractSessionId(url);
        if (sessionId) {
          processSessionId(sessionId);
        }
      });

      return () => subscription.remove();
    }
  }, []);

  const login = async () => {
    const redirectUrl = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? window.location.origin + '/' : '/')
      : Linking.createURL('/');
    
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

    if (Platform.OS === 'web') {
      window.location.href = authUrl;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        const sessionId = extractSessionId(result.url);
        if (sessionId) {
          await processSessionId(sessionId);
        }
      }
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state
      await authApi.removeToken();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
