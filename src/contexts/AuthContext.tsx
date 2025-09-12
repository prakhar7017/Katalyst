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
    // Check if user is already authenticated (e.g., from localStorage)
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
      // Extract user information from Google response
      const profile = response.profileObj || {};
      const user: User = {
        id: profile.googleId || response.sub || '',
        name: profile.name || '',
        email: profile.email || '',
        picture: profile.imageUrl || '',
        accessToken: response.access_token || response.accessToken || '',
      };

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Update auth state
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
    // Clear user from localStorage
    localStorage.removeItem('user');

    // Update auth state
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
