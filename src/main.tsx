import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { initializeDatabase } from './utils/db'

// Initialize database
initializeDatabase()
  .then((initialized) => {
    console.log('Database initialization status:', initialized ? 'Success' : 'Failed');
  })
  .catch((error) => {
    console.error('Database initialization error:', error);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
