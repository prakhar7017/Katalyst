// Type definitions for our application

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  accessToken: string;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: string;
  attendees: Attendee[];
  description?: string;
  summary?: string;
  location?: string;
}

export interface Attendee {
  email: string;
  name?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
