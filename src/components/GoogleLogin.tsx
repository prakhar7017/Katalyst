import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Add window type for Google API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

// Type definitions for Google API
interface GoogleInitConfig {
  client_id: string;
  callback: (response: { credential: string }) => void;
  auto_select?: boolean;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: { access_token: string }) => void;
}

const GoogleLogin: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const parseJwt = useCallback((token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return {};
    }
  }, []);
  const handleTokenResponse = useCallback((response: { access_token: string }) => {
    if (response && response.access_token) {
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${response.access_token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          const user = {
            id: data.sub,
            name: data.name,
            email: data.email,
            picture: data.picture,
            accessToken: response.access_token,
          };
          login(user);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching user info:', error);
          setIsLoading(false);
        });
    } else {
      console.error('No access token received');
      setIsLoading(false);
    }
  }, [login]);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    const credential = response.credential;
    const payload = parseJwt(credential);
    
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      accessToken: credential, // Store the JWT token as accessToken
    };
    
    login(user);
  }, [login, parseJwt]);

  const initializeGoogleAuth = useCallback(() => {
    if (!window.google) {
      console.error('Google API not loaded');
      return;
    }
    
    // Check if client ID is available
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not found in environment variables');
      return;
    }
    
    console.log('Initializing Google Auth with client ID:', clientId);
    
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: handleTokenResponse,
      });
      
      console.log('Google Auth initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
    }
  }, [handleCredentialResponse, handleTokenResponse]);
  
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.querySelector('script#google-api')) {
        initializeGoogleAuth();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-api';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, [initializeGoogleAuth]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    console.log('Attempting Google login...');
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not found in environment variables');
      setIsLoading(false);
      return;
    }
    
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        console.log('Requesting access token with scopes...');
        window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: handleTokenResponse,
        }).requestAccessToken();
      } catch (error) {
        console.error('Error requesting access token:', error);
        setIsLoading(false);
      }
    } else {
      console.error('Google API not initialized');
      setIsLoading(false);
    }
  };
  
  const handleMockLogin = () => {
    const mockUser = {
      id: 'mock-user-123',
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://via.placeholder.com/150',
      accessToken: 'mock-access-token-for-testing',
    };
    
    login(mockUser);
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
        )}
        Sign in with Google
      </button>
      
      <button
        onClick={handleMockLogin}
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
      >
        Sign in with Mock Account (For Testing)
      </button>
    </div>
  );
};

export default GoogleLogin;
