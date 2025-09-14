import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCalendarEventsWithAI, getMockCalendarEventsWithAI } from '../utils/composioOpenAI';
import type { CalendarEvent } from '../mcp/types';
import type { User } from '../types';

interface UseCalendarMCPResult {
  upcomingEvents: CalendarEvent[];
  pastEvents: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  getEventDetails: (eventId: string) => Promise<CalendarEvent | null>;
}

/**
 * Google Calendar event interface
 */
interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: { displayName?: string; email?: string };
  recurringEventId?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      type?: string;
      uri?: string;
    }>;
  };
  colorId?: string;
}

/**
 * Helper function to map Google Calendar event to our CalendarEvent type
 */
function mapGoogleEvent(event: GoogleCalendarEvent): CalendarEvent {
  return {
    id: event.id || `event-${Math.random().toString(36).substring(2, 9)}`,
    summary: event.summary || 'Untitled Event',
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: event.start?.dateTime || new Date().toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: event.end?.dateTime || new Date().toISOString(),
      timeZone: 'UTC'
    },
    attendees: event.attendees?.map(attendee => ({
      email: attendee.email || 'unknown@example.com',
      displayName: attendee.displayName,
      responseStatus: (attendee.responseStatus as "needsAction" | "declined" | "tentative" | "accepted" | undefined)
    })) || [],
    organizer: event.organizer ? {
      email: event.organizer.email || 'organizer@example.com',
      displayName: event.organizer.displayName
    } : undefined,
    status: 'confirmed'
  };
}

export function useCalendarMCP(maxResults = 5): UseCalendarMCPResult {
  const { isAuthenticated, user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a valid connection ID
  const hasValidConnection = useCallback(() => {
    return isAuthenticated && user && 'connectionId' in user && !!user.connectionId;
  }, [isAuthenticated, user]);
  const fetchEvents = useCallback(async () => {
    if (!hasValidConnection()) {
      console.log('No valid connection ID available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the connectionId from the user object
      const connectionId = (user as User & { connectionId: string }).connectionId;
      const userId = (user as User & { id: string }).id;
      console.log('Fetching events with connection ID:', connectionId);
      
      // Use the new OpenAI-powered fetchCalendarEvents function
      const { upcoming, past } = await fetchCalendarEventsWithAI(connectionId,userId);
      console.log("upcoming",upcoming);
      
      // Map the Google Calendar events to our CalendarEvent type
      let mappedUpcoming = upcoming.map((event: Record<string, unknown>) => mapGoogleEvent(event as GoogleCalendarEvent));
      let mappedPast = past.map((event: Record<string, unknown>) => mapGoogleEvent(event as GoogleCalendarEvent));
      
      // Filter events based on current time
      const currentTime = new Date();
      
      // Re-filter events based on current time
      const allEvents = [...mappedUpcoming, ...mappedPast];
      mappedUpcoming = allEvents.filter(event => {
        const startTime = new Date(event.start.dateTime);
        return startTime >= currentTime;
      }).sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
      
      mappedPast = allEvents.filter(event => {
        const startTime = new Date(event.start.dateTime);
        return startTime < currentTime;
      }).sort((a, b) => new Date(b.start.dateTime).getTime() - new Date(a.start.dateTime).getTime());
      
      setUpcomingEvents(mappedUpcoming);
      setPastEvents(mappedPast);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError('Failed to fetch calendar events. Please try again.');
      
      // Use mock data if API call fails
      const { upcoming, past } = getMockCalendarEventsWithAI(maxResults);
      let mappedUpcoming = upcoming.map((event: Record<string, unknown>) => mapGoogleEvent(event as GoogleCalendarEvent));
      let mappedPast = past.map((event: Record<string, unknown>) => mapGoogleEvent(event as GoogleCalendarEvent));
      
      // Filter mock events based on current time
      const currentTime = new Date();
      
      // Re-filter events based on current time
      const allEvents = [...mappedUpcoming, ...mappedPast];
      mappedUpcoming = allEvents.filter(event => {
        const startTime = new Date(event.start.dateTime);
        return startTime >= currentTime;
      }).sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
      
      mappedPast = allEvents.filter(event => {
        const startTime = new Date(event.start.dateTime);
        return startTime < currentTime;
      }).sort((a, b) => new Date(b.start.dateTime).getTime() - new Date(a.start.dateTime).getTime());
      
      setUpcomingEvents(mappedUpcoming);
      setPastEvents(mappedPast);
    } finally {
      setIsLoading(false);
    }
  }, [user, maxResults, hasValidConnection]);

  const getEventDetails = async (eventId: string): Promise<CalendarEvent | null> => {
    if (!hasValidConnection()) {
      return null;
    }

    try {
      // For now, find the event in our local state
      // In a future implementation, we could fetch the specific event from the API
      const event = [...upcomingEvents, ...pastEvents].find(event => event.id === eventId);
      return event || null;
    } catch (err) {
      console.error(`Error fetching event details for ${eventId}:`, err);
      setError(err instanceof Error ? err.message : `Failed to fetch event details for ${eventId}`);
      return null;
    }
  };

  useEffect(() => {
    if (hasValidConnection()) {
      fetchEvents();
    } else {
      setUpcomingEvents([]);
      setPastEvents([]);
    }
  }, [hasValidConnection, fetchEvents]);

  return {
    upcomingEvents,
    pastEvents,
    isLoading,
    error,
    refreshEvents: fetchEvents,
    getEventDetails
  };
}
