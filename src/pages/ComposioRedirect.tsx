import React, { useEffect } from 'react';

/**
 * This component handles redirects from the Composio authentication page
 * It extracts the parameters from the URL and redirects to our application's callback URL
 */
const ComposioRedirect: React.FC = () => {
  useEffect(() => {
    const handleRedirect = () => {
      try {
        // Get the current URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const connectedAccountId = urlParams.get('connectedAccountId');
        const appName = urlParams.get('appName');
        
        console.log('Composio redirect parameters:', { status, connectedAccountId, appName });
        
        // Construct our application's callback URL with the same parameters
        const callbackUrl = new URL('http://localhost:5173/auth/callback');
        callbackUrl.searchParams.append('status', status || '');
        callbackUrl.searchParams.append('connectedAccountId', connectedAccountId || '');
        callbackUrl.searchParams.append('appName', appName || '');
        
        console.log('Redirecting to application callback:', callbackUrl.toString());
        
        // Redirect to our application's callback URL
        window.location.href = callbackUrl.toString();
      } catch (error) {
        console.error('Error handling Composio redirect:', error);
      }
    };
    
    handleRedirect();
  }, []);
  
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
            Redirecting to application...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComposioRedirect;
