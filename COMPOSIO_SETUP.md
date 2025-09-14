# Composio Authentication Setup Guide

This guide explains how to set up Composio authentication for Google Calendar integration in your calendar MCP app.

## Prerequisites

1. **Composio Account**: Sign up at [composio.dev](https://composio.dev)
2. **Google Calendar API Access**: Ensure your Google account has Calendar API enabled
3. **Environment Variables**: Set up the required environment variables

## Configuration Details

### Your Composio Auth Configuration
- **Auth Config ID**: `ac_XwlKyJM7acC-`
- **Toolkit Slug**: `GOOGLECALENDAR`
- **Created**: Sep 14, 2025

### Environment Variables

Add these variables to your `.env` file:

```env
# Composio Configuration
VITE_COMPOSIO_API_KEY=your-composio-api-key

# Google OAuth Configuration (for fallback)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5174/auth/callback

# OpenAI API Key (for meeting summaries)
VITE_OPENAI_API_KEY=your-openai-api-key

# Database Configuration
NEON_DB_URL=postgresql://user:password@your-neon-db-url.neon.tech/neondb
```

## How It Works

### 1. Authentication Flow

The app provides two authentication options:

#### Option A: Composio Authentication (Recommended)
- Uses your specific Auth Config ID: `ac_XwlKyJM7acC-`
- Integrates with Google Calendar through Composio's MCP
- Handles token refresh automatically
- More secure and managed authentication

#### Option B: Direct Google Authentication (Fallback)
- Direct Google OAuth integration
- Manual token management
- Used when Composio API key is not available

### 2. Calendar Integration

The `ComposioCalendarMCP` class handles:
- **Primary**: Composio MCP integration using your Auth Config
- **Fallback**: Direct Google Calendar API calls
- **Mock Mode**: Testing without real credentials

### 3. Meeting Detection

Advanced filtering system that identifies meetings using:
- Attendee presence (highest confidence)
- Meeting-related keywords in titles/descriptions
- Duration-based heuristics (15-120 minutes)
- Location indicators (conference rooms, video platforms)

## Setup Steps

### 1. Get Your Composio API Key
1. Log into your Composio dashboard
2. Navigate to API Keys section
3. Generate or copy your API key
4. Add it to your `.env` file as `VITE_COMPOSIO_API_KEY`

### 2. Configure Redirect URL
Ensure your Composio Auth Config has the correct redirect URL:
```
http://localhost:5174/auth/callback
```

### 3. Test the Integration
1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Click "Sign in with Gmail (Composio)"
4. Complete the OAuth flow
5. Verify calendar events are loaded

## Troubleshooting

### Common Issues

1. **"Composio API key not configured"**
   - Ensure `VITE_COMPOSIO_API_KEY` is set in your `.env` file
   - Restart your development server after adding the key

2. **"Authentication failed"**
   - Verify your Auth Config ID (`ac_XwlKyJM7acC-`) is correct
   - Check that the redirect URL matches your Composio configuration

3. **"No events found"**
   - The app filters events to show only meetings
   - Try the "Mock Account" option to see sample data
   - Check your Google Calendar has events with attendees

### Mock Mode for Testing

If you want to test without real credentials:
1. Click "Sign in with Mock Composio Account (For Testing)"
2. This will show sample meeting data
3. Useful for development and UI testing

## File Structure

```
src/
├── components/
│   ├── ComposioAuth.tsx          # Composio authentication component
│   ├── ComposioCallback.tsx      # OAuth callback handler
│   └── GoogleLogin.tsx           # Fallback Google auth
├── contexts/
│   └── AuthContext.tsx           # Authentication state management
├── mcp/
│   ├── ComposioCalendarMCP.ts    # Main calendar integration
│   └── types.ts                  # Type definitions
└── pages/
    └── Login.tsx                 # Login page with both options
```

## Security Notes

- Never commit your `.env` file to version control
- Use environment-specific API keys for different deployments
- The Composio integration handles token refresh automatically
- All authentication tokens are stored securely in localStorage

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure your Composio Auth Config is active
4. Test with mock authentication first to isolate issues
