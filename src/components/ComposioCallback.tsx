import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * ComposioCallback component to handle the OAuth callback from Composio
 */
const ComposioCallback: React.FC = () => {
  const { login } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const connectedAccountId = urlParams.get('connectedAccountId');
        const appName = urlParams.get('appName');
        
        console.log('Composio callback received:', { status, connectedAccountId, appName });
        
        if (status !== 'success' || !connectedAccountId) {
          throw new Error(`Authentication failed: ${status || 'unknown status'}`);
        }
        
        const storedRequest = sessionStorage.getItem('composio_connection_request');
        let userId = 'composio-user';
        
        if (storedRequest) {
          const parsed = JSON.parse(storedRequest);
          userId = parsed.userId || userId;
          console.log('Retrieved stored request:', parsed);
        }
        
        if (import.meta.env.VITE_COMPOSIO_API_KEY) {
          console.log('Composio API key is configured');
          
          const user = {
            id: userId,
            name: `${appName || 'Composio'} User`,
            email: userId,
            picture: 'https://via.placeholder.com/150',
            accessToken: connectedAccountId,
            refreshToken: connectedAccountId,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            provider: 'composio-gmail' as const,
            connectionId: connectedAccountId,
            appName: appName || 'googlecalendar'
          };

          login(user);
          window.location.href = '/';
        } else {
          throw new Error('Composio API key not configured');
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processing Authentication
          </h2>
          <div className="mt-4">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your authentication...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComposioCallback;
