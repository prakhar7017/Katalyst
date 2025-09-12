import { CalendarEvent, CalendarListResponse, MCPCalendarClient } from './types';

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

  private async fetchFromAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.apiBase}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
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
    const now = new Date().toISOString();
    
    const response = await this.fetchFromAPI<CalendarListResponse>(
      `/calendars/${encodeURIComponent(this.calendarId)}/events`,
      {
        timeMin: now,
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      }
    );
    
    return response.items;
  }

  async getPastEvents(maxResults = 5): Promise<CalendarEvent[]> {
    const now = new Date().toISOString();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const response = await this.fetchFromAPI<CalendarListResponse>(
      `/calendars/${encodeURIComponent(this.calendarId)}/events`,
      {
        timeMax: now,
        timeMin: oneMonthAgo.toISOString(),
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      }
    );
    
    // Return events in reverse chronological order (most recent first)
    return response.items.reverse();
  }

  async getEventDetails(eventId: string): Promise<CalendarEvent> {
    return this.fetchFromAPI<CalendarEvent>(
      `/calendars/${encodeURIComponent(this.calendarId)}/events/${encodeURIComponent(eventId)}`
    );
  }
}
