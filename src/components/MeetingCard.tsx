import React from 'react';
import { CalendarEvent } from '../mcp/types';

interface MeetingCardProps {
  meeting: CalendarEvent;
  isPast?: boolean;
  onClick?: (meeting: CalendarEvent) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, isPast = false, onClick }) => {
  // Format date and time
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Calculate duration in minutes
  const calculateDuration = () => {
    const start = new Date(meeting.start.dateTime);
    const end = new Date(meeting.end.dateTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    if (durationMinutes < 60) {
      return `${durationMinutes} min`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  // Get attendee count
  const attendeeCount = meeting.attendees?.length || 0;

  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick(meeting);
    }
  };

  return (
    <div 
      className={`meeting-card p-4 rounded-lg shadow-md mb-3 cursor-pointer transition-all ${
        isPast ? 'bg-gray-50 border border-gray-200' : 'bg-white border-l-4 border-blue-500'
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">{meeting.summary}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isPast ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
        }`}>
          {calculateDuration()}
        </span>
      </div>
      
      <div className="text-sm text-gray-500 mb-2">
        {formatDateTime(meeting.start.dateTime)}
      </div>
      
      {meeting.location && (
        <div className="text-xs text-gray-500 mb-2 truncate">
          <span className="inline-block mr-1">📍</span> {meeting.location}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-500">
            {attendeeCount > 0 ? `${attendeeCount} attendee${attendeeCount !== 1 ? 's' : ''}` : 'No attendees'}
          </span>
        </div>
        
        {isPast && meeting.description && (
          <span className="text-xs text-blue-600 hover:text-blue-800">
            View summary
          </span>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;
