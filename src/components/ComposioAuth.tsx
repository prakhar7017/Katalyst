import React, { useState } from 'react';
import { Composio } from '@composio/core';

/**
 * ComposioAuth component for handling authentication with Composio
 */
const ComposioAuth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComposioAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!import.meta.env.VITE_COMPOSIO_API_KEY || !import.meta.env.VITE_GOOGLE_CALENDAR_CONFIG_ID) {
        throw new Error('Composio API key or Google Calendar config ID not found'); 
      }

      const composio = new Composio({
        apiKey: import.meta.env.VITE_COMPOSIO_API_KEY,
        baseURL: window.location.hostname.includes('vercel.app') ? '/api/composio' : undefined
      });
      console.log('Initializing Composio authentication for Google Calendar...');
      
      const authConfigId = import.meta.env.VITE_GOOGLE_CALENDAR_CONFIG_ID;
      const userId = `user-${Date.now()}@calendar-app.com`; // Generate unique user ID

      const connectionRequest = await composio.connectedAccounts.initiate(
        userId,
        authConfigId,
        {
          callbackUrl: `${import.meta.env.VITE_COMPOSIO_REDIRECT_URI}/auth/callback`
        }
      );      
      sessionStorage.setItem('composio_connection_request', JSON.stringify({
        connectionId: connectionRequest.id,
        userId: userId,
        authConfigId: authConfigId
      }));
      
      if (connectionRequest.redirectUrl) {
        console.log('Redirecting to Composio auth URL:', connectionRequest.redirectUrl);
        window.location.href = connectionRequest.redirectUrl;
      } else {
        throw new Error('No redirect URL received from Composio');
      }
      
    } catch (err) {
      console.error('Composio authentication error:', err);
      setError('Failed to authenticate with Composio. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={handleComposioAuth}
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
        Sign in with (Composio)
      </button>
    </div>
  );
};

export default ComposioAuth;
