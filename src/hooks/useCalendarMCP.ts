import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleCalendarMCP } from '../mcp/GoogleCalendarMCP';
import type { CalendarEvent } from '../mcp/types';

interface UseCalendarMCPResult {
  upcomingEvents: CalendarEvent[];
  pastEvents: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  getEventDetails: (eventId: string) => Promise<CalendarEvent | null>;
}

export function useCalendarMCP(maxResults = 5): UseCalendarMCPResult {
  const { isAuthenticated, user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create MCP client when authenticated
  const getMCPClient = () => {
    if (!isAuthenticated || !user?.accessToken) {
      throw new Error('User not authenticated');
    }
    return new GoogleCalendarMCP(user.accessToken);
  };

  // Fetch events from Google Calendar
  const fetchEvents = async () => {
    if (!isAuthenticated || !user?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mcpClient = getMCPClient();
      
      // Fetch upcoming and past events in parallel
      const [upcoming, past] = await Promise.all([
        mcpClient.getUpcomingEvents(maxResults),
        mcpClient.getPastEvents(maxResults)
      ]);
      
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  // Get details for a specific event
  const getEventDetails = async (eventId: string): Promise<CalendarEvent | null> => {
    if (!isAuthenticated || !user?.accessToken) {
      return null;
    }

    try {
      const mcpClient = getMCPClient();
      return await mcpClient.getEventDetails(eventId);
    } catch (err) {
      console.error(`Error fetching event details for ${eventId}:`, err);
      setError(err instanceof Error ? err.message : `Failed to fetch event details for ${eventId}`);
      return null;
    }
  };

  // Fetch events on initial load and when authentication changes
  useEffect(() => {
    if (isAuthenticated && user?.accessToken) {
      fetchEvents();
    } else {
      // Reset state when not authenticated
      setUpcomingEvents([]);
      setPastEvents([]);
    }
  }, [isAuthenticated, user?.accessToken]);

  return {
    upcomingEvents,
    pastEvents,
    isLoading,
    error,
    refreshEvents: fetchEvents,
    getEventDetails
  };
}
