import { useState } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import GoogleLogin from './components/GoogleLogin'
import MeetingList from './components/MeetingList'
import { useCalendarMCP } from './hooks/useCalendarMCP'
import type { CalendarEvent } from './mcp/types'

function App() {
  const { isAuthenticated, user, logout } = useAuth()
  const { upcomingEvents, pastEvents, isLoading, error, refreshEvents } = useCalendarMCP(5)
  // This would be used to show meeting details in a modal or separate view
  const handleMeetingClick = (meeting: CalendarEvent) => {
    // For now, just log the meeting details
    console.log('Selected meeting:', meeting)
  }

  const handleRefresh = () => {
    refreshEvents()
  }

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
            <div className="flex justify-end mb-4">
              <button
                onClick={handleRefresh}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MeetingList
                title="Upcoming Meetings"
                meetings={upcomingEvents}
                isLoading={isLoading}
                error={error}
                onMeetingClick={handleMeetingClick}
              />
              
              <MeetingList
                title="Past Meetings"
                meetings={pastEvents}
                isPast={true}
                isLoading={isLoading}
                error={error}
                onMeetingClick={handleMeetingClick}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
