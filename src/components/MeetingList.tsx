import React from 'react';
import type { CalendarEvent } from '../mcp/types';
import MeetingCard from './MeetingCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface MeetingListProps {
  meetings: CalendarEvent[];
  isPast?: boolean;
  isLoading: boolean;
  error: string | null;
  onMeetingClick?: (meeting: CalendarEvent) => void;
  title: string;
}

const MeetingList: React.FC<MeetingListProps> = ({
  meetings,
  isPast = false,
  isLoading,
  error,
  onMeetingClick,
  title
}) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
      </div>
      <div className="border-t border-gray-200">
        {isLoading ? (
          <div className="py-8">
            <LoadingSpinner size="medium" text={`Loading ${isPast ? 'past' : 'upcoming'} meetings...`} />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorMessage 
              message={error} 
              onRetry={onMeetingClick ? undefined : () => window.location.reload()} 
            />
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No {isPast ? 'past' : 'upcoming'} meetings found.</p>
          </div>
        ) : (
          <div className="p-4">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                isPast={isPast}
                onClick={onMeetingClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingList;
