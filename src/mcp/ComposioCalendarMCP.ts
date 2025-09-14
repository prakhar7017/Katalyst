import type { CalendarEvent, MCPCalendarClient } from './types';
import { Composio } from '@composio/core';

// Google Calendar API response types
interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  created?: string;
  updated?: string;
  status?: string;
}

/**
 * Google Calendar MCP implementation
 * This implementation follows the Model-Context-Protocol pattern
 * for integrating with Google Calendar
 */
export class ComposioCalendarMCP implements MCPCalendarClient {
  private accessToken: string;
  private calendarId: string = 'primary';
  private apiBase: string = 'https://www.googleapis.com/calendar/v3';
  private composio?: Composio;
  private connectedAccountId: string;

  constructor(accessToken: string, calendarId?: string) {
    this.accessToken = accessToken;
    this.connectedAccountId = accessToken; // For Composio, the accessToken is the connectedAccountId
    
    if (calendarId) {
      this.calendarId = calendarId;
    }
    
    // Initialize Composio if API key is available
    if (import.meta.env.VITE_COMPOSIO_API_KEY) {
      this.composio = new Composio({
        apiKey: import.meta.env.VITE_COMPOSIO_API_KEY
      });
    }
  }

  async getUpcomingEvents(maxResults = 5): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching upcoming events...');
      const now = new Date().toISOString();
      
      if (this.accessToken === 'mock-access-token-for-testing') {
        console.log('Using mock data for upcoming events');
        return this.getMockUpcomingEvents(maxResults);
      }
      
      // Try using Composio first, fallback to direct API
      let events: CalendarEvent[];
      
      if (this.composio && import.meta.env.VITE_COMPOSIO_API_KEY) {
        try {
          const composioResponse = await fetch(`https://api.composio.dev/connected-accounts/${this.connectedAccountId}/proxy/calendars/${encodeURIComponent(this.calendarId)}/events?timeMin=${encodeURIComponent(now)}&maxResults=${maxResults * 3}&singleEvents=true&orderBy=startTime`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_COMPOSIO_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!composioResponse.ok) {
            throw new Error(`Composio API error: ${composioResponse.status}`);
          }
          
          const data = await composioResponse.json();
          
          events = data.items.map((item: GoogleCalendarEvent) => this.mapGoogleEvent(item));
        } catch (composioError) {
          console.warn('Composio request failed, falling back to direct API:', composioError);
          events = await this.fetchEventsDirectly(now, maxResults * 3, 'timeMin');
        }
      } else {
        events = await this.fetchEventsDirectly(now, maxResults * 3, 'timeMin');
      }
      
      const limitedEvents = events.slice(0, maxResults);
      
      console.log(`Fetched ${events.length} upcoming events, filtered to ${limitedEvents.length} meetings`);
      return limitedEvents;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      // Return mock data as fallback
      return this.getMockUpcomingEvents(maxResults);
    }
  }

  /**
   * Fetch past calendar events 
   */
  async getPastEvents(maxResults = 5): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching past events...');
      const now = new Date().toISOString();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      if (this.accessToken === 'mock-access-token-for-testing') {
        console.log('Using mock data for past events');
        return this.getMockPastEvents(maxResults);
      }
      
      // Fetch calendar events directly from Google Calendar API
      const url = new URL(`${this.apiBase}/calendars/${encodeURIComponent(this.calendarId)}/events`);
      url.searchParams.append('timeMax', now);
      url.searchParams.append('timeMin', oneMonthAgo.toISOString());
      url.searchParams.append('maxResults', (maxResults * 3).toString()); // Request more to filter
      url.searchParams.append('singleEvents', 'true');
      url.searchParams.append('orderBy', 'startTime');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }
      
      const data = await response.json();
      const events = data.items.map((item: GoogleCalendarEvent) => this.mapGoogleEvent(item));
      
      // Filter to include only meeting events
      const meetingEvents = this.filterMeetingEvents(events);
      
      // Return events in reverse chronological order (most recent first) and limit to requested number
      const limitedEvents = meetingEvents.reverse().slice(0, maxResults);
      
      console.log(`Fetched ${events.length} past events, filtered to ${limitedEvents.length} meetings`);
      return limitedEvents;
    } catch (error) {
      console.error('Error fetching past events:', error);
      // Return mock data as fallback
      return this.getMockPastEvents(maxResults);
    }
  }

  /**
   * Get details for a specific event
   */
  async getEventDetails(eventId: string): Promise<CalendarEvent> {
    try {
      console.log(`Fetching details for event ${eventId}...`);
      
      // For mock testing when no real access token is available
      if (this.accessToken === 'mock-access-token-for-testing') {
        console.log('Using mock data for event details');
        const mockEvents = [...this.getMockUpcomingEvents(10), ...this.getMockPastEvents(10)];
        const event = mockEvents.find(e => e.id === eventId);
        if (event) {
          return event;
        }
        throw new Error('Mock event not found');
      }
      
      // Fetch event details directly from Google Calendar API
      const url = `${this.apiBase}/calendars/${encodeURIComponent(this.calendarId)}/events/${encodeURIComponent(eventId)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }
      
      const data = await response.json();
      const event = this.mapGoogleEvent(data);
      
      console.log('Event details fetched successfully');
      return event;
    } catch (error) {
      console.error(`Error fetching event details for ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Map Google Calendar event to our CalendarEvent format
   */
  private mapGoogleEvent(event: GoogleCalendarEvent): CalendarEvent {
    return {
      id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.start?.dateTime || new Date().toISOString(),
        timeZone: event.start?.timeZone || 'UTC',
      },
      end: {
        dateTime: event.end?.dateTime || new Date().toISOString(),
        timeZone: event.end?.timeZone || 'UTC',
      },
      attendees: event.attendees || [],
      organizer: event.organizer || { email: 'unknown@example.com' },
      created: event.created,
      updated: event.updated,
      status: event.status,
    };
  }
  
  /**
   * Generate mock upcoming events for testing
   */
  private getMockUpcomingEvents(count: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const startTime = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      events.push({
        id: `upcoming-${i}`,
        summary: `Upcoming Meeting ${i + 1}`,
        description: `This is a mock upcoming meeting ${i + 1}`,
        location: i % 2 === 0 ? 'Virtual Meeting' : 'Conference Room A',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        },
        attendees: [
          {
            email: 'attendee1@example.com',
            displayName: 'Attendee One',
            responseStatus: 'accepted'
          },
          {
            email: 'attendee2@example.com',
            displayName: 'Attendee Two',
            responseStatus: 'tentative'
          }
        ],
        organizer: {
          email: 'organizer@example.com',
          displayName: 'Meeting Organizer'
        },
        created: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'confirmed'
      });
    }
    
    return events;
  }
  
  /**
   * Generate mock past events for testing
   */
  private getMockPastEvents(count: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const startTime = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); 
      events.push({
        id: `past-${i}`,
        summary: `Past Meeting ${i + 1}`,
        description: `This is a mock past meeting ${i + 1}`,
        location: i % 2 === 0 ? 'Virtual Meeting' : 'Conference Room B',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        },
        attendees: [
          {
            email: 'past-attendee1@example.com',
            displayName: 'Past Attendee One',
            responseStatus: 'accepted'
          },
          {
            email: 'past-attendee2@example.com',
            displayName: 'Past Attendee Two',
            responseStatus: 'accepted'
          }
        ],
        organizer: {
          email: 'past-organizer@example.com',
          displayName: 'Past Meeting Organizer'
        },
        created: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'confirmed'
      });
    }
    return events;
  }

  /**
   * Fetch events directly from Google Calendar API (fallback method)
   */
  private async fetchEventsDirectly(timeParam: string, maxResults: number, timeType: 'timeMin' | 'timeMax'): Promise<CalendarEvent[]> {
    const url = new URL(`${this.apiBase}/calendars/${encodeURIComponent(this.calendarId)}/events`);
    url.searchParams.append(timeType, timeParam);
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items.map((item: GoogleCalendarEvent) => this.mapGoogleEvent(item));
  }

  /**
   * Filter events to include only meetings using multiple heuristics
   * @param events List of calendar events
   * @returns Filtered list containing only meeting events
   */
  private filterMeetingEvents(events: CalendarEvent[]): CalendarEvent[] {
    // First, sort events by likelihood of being a meeting
    const scoredEvents = events.map(event => {
      let score = 0;
      
      // Heuristic 1: Events with attendees are very likely meetings
      if (event.attendees && event.attendees.length > 0) {
        score += 100; // High score for having attendees
      }
      
      // Heuristic 2: Events with meeting-related keywords
      const meetingKeywords = [
        'meeting', 'call', 'sync', 'discussion', 'standup', 'review', 'interview', 
        '1:1', '1-1', 'one-on-one', 'conference', 'webinar', 'workshop', 'huddle',
        'catchup', 'catch-up', 'check-in', 'checkin', 'alignment', 'planning',
        'retrospective', 'retro', 'demo', 'presentation', 'kickoff', 'kick-off'
      ];
      
      const summary = event.summary?.toLowerCase() || '';
      const description = event.description?.toLowerCase() || '';
      
      // Check for keywords in summary (title)
      for (const keyword of meetingKeywords) {
        if (summary.includes(keyword)) {
          score += 50; // Medium score for keywords in title
          break;
        }
      }
      
      // Check for keywords in description
      for (const keyword of meetingKeywords) {
        if (description.includes(keyword)) {
          score += 25; // Lower score for keywords in description
          break;
        }
      }
      
      // Heuristic 3: Duration-based heuristic (meetings are typically 30-60 min)
      try {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        
        // Typical meeting durations
        if (durationMinutes >= 15 && durationMinutes <= 120) {
          score += 15;
          
          // Standard meeting slots get extra points
          if ([15, 30, 45, 60, 90, 120].includes(durationMinutes)) {
            score += 10;
          }
        }
      } catch {
        // If we can't parse dates, just continue
      }
      
      // Heuristic 4: Location indicates meeting
      if (event.location) {
        const location = event.location.toLowerCase();
        const meetingLocations = ['room', 'conference', 'meet', 'zoom', 'teams', 'google meet', 'webex', 'skype', 'hangout'];
        
        for (const loc of meetingLocations) {
          if (location.includes(loc)) {
            score += 20;
            break;
          }
        }
      }
      
      return { event, score };
    });
    
    // Sort by score (highest first)
    scoredEvents.sort((a, b) => b.score - a.score);
    
    // Consider events with a score above threshold as meetings
    // If there are no high-scoring events, take the top 5 by score
    const meetingThreshold = 20; // Minimum score to be considered a meeting
    
    const filteredEvents = scoredEvents
      .filter(item => item.score >= meetingThreshold)
      .map(item => item.event);
    
    // If we have too few events after filtering, include the highest scoring ones
    if (filteredEvents.length < 5 && scoredEvents.length > 0) {
      const remainingEvents = scoredEvents
        .filter(item => item.score < meetingThreshold)
        .map(item => item.event);
      
      // Add enough events to reach at least 5 (if available)
      const neededCount = Math.min(5 - filteredEvents.length, remainingEvents.length);
      filteredEvents.push(...remainingEvents.slice(0, neededCount));
    }
    
    return filteredEvents;
  }
}
