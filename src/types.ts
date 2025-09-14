// Application types

export interface User {
  id: string;
  connectionId: string;
  appName: string;
  picture: string;
  expiresAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
