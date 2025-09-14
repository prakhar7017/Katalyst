import React from 'react';
import ComposioAuth from '../components/ComposioAuth';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Calendar MCP App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your meetings
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div className="border border-gray-300 rounded-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sign in with Composio (Gmail)</h3>
              <p className="text-sm text-gray-500 mb-4">
                Use Composio MCP integration to authenticate with your Gmail account
              </p>
              <ComposioAuth />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
