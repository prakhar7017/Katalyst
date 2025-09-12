import './App.css'
import { useAuth } from './contexts/AuthContext'
import GoogleLogin from './components/GoogleLogin'

function App() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar MCP App</h1>
          {isAuthenticated && user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full mr-2" 
                  />
                )}
                <span className="text-sm font-medium text-gray-700 hidden md:inline">
                  {user.name}
                </span>
              </div>
              <button 
                onClick={logout}
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-3 rounded"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!isAuthenticated ? (
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">Welcome to Calendar MCP App</h2>
              <p className="mb-6">Please sign in with your Google account to view your calendar meetings.</p>
              <GoogleLogin />
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Meetings</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <p className="text-center py-4 text-gray-500">Loading upcoming meetings...</p>
                </div>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Past Meetings</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <p className="text-center py-4 text-gray-500">Loading past meetings...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
