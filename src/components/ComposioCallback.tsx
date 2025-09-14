import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createOrUpdateUser } from '../utils/db';

/**
 * ComposioCallback component to handle the OAuth callback from Composio
 */
const ComposioCallback: React.FC = () => {
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('ComposioCallback component mounted',isProcessing);

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
        // Default fallback user ID in case storage fails
        let userId = `user-fallback-${Date.now()}@calendar-app.com`;
        
        if (storedRequest) {
          try {
            const parsed = JSON.parse(storedRequest);
            // Use the stored userId from the authentication step
            if (parsed.userId) {
              userId = parsed.userId;
              console.log('Retrieved user ID from session storage:', userId);
            } else {
              console.warn('No userId found in stored request, using fallback');
            }
          } catch (error) {
            console.error('Error parsing stored connection request:', error);
          }
        } else {
          console.warn('No connection request found in session storage, using fallback user ID');
        }
        
        console.log('ComposioCallback using user ID:', userId);
        
        if (import.meta.env.VITE_COMPOSIO_API_KEY) {
          const user = {
            id: userId,
            picture: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Jude`,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            connectionId: connectedAccountId, // Store connection ID for API calls
            appName: appName || 'googlecalendar'
          };

          try {
            // Store user in database
            console.log('Storing user in database...');
            await createOrUpdateUser({
              id: user.id,
              connectionId: user.connectionId,
              appName: user.appName,
            });
            console.log('User stored in database successfully');

            // Login the user
            login(user);

            // Redirect to main app
            window.location.href = '/';
          } catch (dbError) {
            console.error('Failed to store user in database:', dbError);
            setError('Authentication successful, but failed to store user data. Please try again.');
            setIsProcessing(false);
          }
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
