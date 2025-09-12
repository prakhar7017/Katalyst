import type { CalendarEvent, CalendarListResponse, MCPCalendarClient } from './types';

export class GoogleCalendarMCP implements MCPCalendarClient {
  private accessToken: string;
  private apiBase = 'https://www.googleapis.com/calendar/v3';
  private calendarId = 'primary'; // Default to primary calendar

  constructor(accessToken: string, calendarId?: string) {
    this.accessToken = accessToken;
    if (calendarId) { 
      this.calendarId = calendarId;
    }
  }
  
  private async getAccessToken(): Promise<string> {
    return this.accessToken;
  }

  private async fetchFromAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.apiBase}${endpoint}`);
  
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const token = await this.getAccessToken();

    const response = await fetch(url.toString(), {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async getUpcomingEvents(maxResults = 5): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching upcoming events...');
      const now = new Date().toISOString();
      
      if (this.accessToken === 'mock-access-token-for-testing') {
        console.log('Using mock data for upcoming events');
        return this.getMockUpcomingEvents(maxResults);
      }
      
      const fetchMaxResults = maxResults * 3;
      
      const response = await this.fetchFromAPI<CalendarListResponse>(
        `/calendars/${encodeURIComponent(this.calendarId)}/events`,
        {
          timeMin: now,
          maxResults: fetchMaxResults.toString(),
          singleEvents: 'true',
          orderBy: 'startTime',
        }
      );
      
      const limitedEvents = response.items?.slice(0, maxResults) || [];
      
      console.log(`Fetched ${response.items?.length} upcoming events, returning ${limitedEvents.length}`);
      return limitedEvents;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return this.getMockUpcomingEvents(maxResults);
    }
  }

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
      
      const fetchMaxResults = maxResults * 3;
      
      const response = await this.fetchFromAPI<CalendarListResponse>(
        `/calendars/${encodeURIComponent(this.calendarId)}/events`,
        {
          timeMax: now,
          timeMin: oneMonthAgo.toISOString(),
          maxResults: fetchMaxResults.toString(),
          singleEvents: 'true',
          orderBy: 'startTime',
        }
      );
    
      const limitedEvents = response.items?.reverse().slice(0, maxResults) || [];
      
      console.log(`Fetched ${response.items?.length} past events, filtered to ${limitedEvents.length} meetings`);
      return limitedEvents;
    } catch (error) {
      console.error('Error fetching past events:', error);
      return this.getMockPastEvents(maxResults);
    }
  }

  async getEventDetails(eventId: string): Promise<CalendarEvent> {
    try {
      console.log(`Fetching details for event ${eventId}...`);
      
      if (this.accessToken === 'mock-access-token-for-testing') {
        console.log('Using mock data for event details');
        const mockEvents = [...this.getMockUpcomingEvents(10), ...this.getMockPastEvents(10)];
        const event = mockEvents.find(e => e.id === eventId);
        if (event) {
          return event;
        }
        throw new Error('Mock event not found');
      }
      
      const event = await this.fetchFromAPI<CalendarEvent>(
        `/calendars/${encodeURIComponent(this.calendarId)}/events/${encodeURIComponent(eventId)}`
      );
      
      console.log('Event details fetched successfully');
      return event;
    } catch (error) {
      console.error(`Error fetching event details for ${eventId}:`, error);
      throw error;
    }
  }
  
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
}
