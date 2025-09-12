// MCP Types for Google Calendar

export interface MCPRequest {
  method: string;
  path: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export interface MCPResponse<T = any> {
  status: number;
  data: T;
  headers?: Record<string, string>;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  created?: string;
  updated?: string;
  status?: string;
}

export interface CalendarListResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

export interface MCPCalendarClient {
  getUpcomingEvents(maxResults?: number): Promise<CalendarEvent[]>;
  getPastEvents(maxResults?: number): Promise<CalendarEvent[]>;
  getEventDetails(eventId: string): Promise<CalendarEvent>;
}
