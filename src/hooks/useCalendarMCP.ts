import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ComposioCalendarMCP } from '../mcp/ComposioCalendarMCP';
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

  const getMCPClient = useCallback(() => {
    if (!isAuthenticated || !user?.accessToken) {
      throw new Error('User not authenticated');
    }
    return new ComposioCalendarMCP(user.accessToken);
  }, [isAuthenticated, user]);

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated || !user?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mcpClient = getMCPClient();
      
      const [upcoming, past] = await Promise.all([
        mcpClient.getUpcomingEvents(maxResults),
        mcpClient.getPastEvents(maxResults)
      ]);
      
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError('Failed to fetch calendar events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, maxResults, getMCPClient]);

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

  useEffect(() => {
    if (isAuthenticated && user?.accessToken) {
      fetchEvents();
    } else {
      setUpcomingEvents([]);
      setPastEvents([]);
    }
  }, [isAuthenticated, user, fetchEvents]);

  return {
    upcomingEvents,
    pastEvents,
    isLoading,
    error,
    refreshEvents: fetchEvents,
    getEventDetails
  };
}
