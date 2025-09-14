// Application types

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  provider?: 'google' | 'composio-gmail';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
