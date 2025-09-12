import React, { useState } from 'react';
import type { CalendarEvent } from '../mcp/types';
import { generateMeetingSummary, generateMockMeetingSummary } from '../utils/openai';

interface MeetingDetailsProps {
  meeting: CalendarEvent;
  onClose: () => void;
  isPast?: boolean;
}

const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meeting, onClose, isPast = false }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const calculateDuration = () => {
    const start = new Date(meeting.start.dateTime);
    const end = new Date(meeting.end.dateTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours} hours ${minutes} minutes` : `${hours} hours`;
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        const generatedSummary = await generateMeetingSummary(meeting);
        setSummary(generatedSummary);
      } else {
        // Use mock summary if API key is not available
        const mockSummary = generateMockMeetingSummary(meeting);
        setSummary(mockSummary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{meeting.summary}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700">
                {formatDateTime(meeting.start.dateTime)}
              </span>
            </div>
            
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                Duration: {calculateDuration()}
              </span>
            </div>
            
            {meeting.location && (
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700">{meeting.location}</span>
              </div>
            )}
          </div>
          
          {meeting.attendees && meeting.attendees.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Attendees</h3>
              <ul className="space-y-1">
                {meeting.attendees.map((attendee, index) => (
                  <li key={index} className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span className="text-sm font-medium text-gray-600">
                        {attendee.displayName ? attendee.displayName.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {attendee.displayName || attendee.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {attendee.responseStatus === 'accepted' ? 'Accepted' : 
                         attendee.responseStatus === 'declined' ? 'Declined' :
                         attendee.responseStatus === 'tentative' ? 'Tentative' : 'No response'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {meeting.description && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <div 
                className="bg-gray-50 p-4 rounded-md text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: meeting.description }}
              />
            </div>
          )}
          
          {isPast && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Meeting Summary</h3>
              
              {summary ? (
                <div 
                  className="bg-blue-50 p-4 rounded-md text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate AI Summary
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;
