import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (response: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAuthState({
          isAuthenticated: true,
          user: parsedUser,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (response: any) => {
    try {
      let user: User;
      
      if (response.id && response.accessToken) {
        user = {
          id: response.id,
          name: response.name || '',
          email: response.email || '',
          picture: response.picture || '',
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt,
          provider: response.provider || 'google',
        };
      } else {
        const profile = response.profileObj || {};
        user = {
          id: profile.googleId || response.sub || '',
          name: profile.name || '',
          email: profile.email || '',
          picture: profile.imageUrl || '',
          accessToken: response.access_token || response.accessToken || '',
          provider: 'google',
        };
      }

      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Login error:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Failed to login. Please try again.',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
