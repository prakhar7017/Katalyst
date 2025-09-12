import OpenAI from 'openai';
import type { CalendarEvent } from '../mcp/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For client-side usage (in production, use server-side API)
});

/**
 * Generate a summary for a meeting using OpenAI
 * @param meeting The meeting to summarize
 * @returns A summary of the meeting
 */
export async function generateMeetingSummary(meeting: CalendarEvent): Promise<string> {
  try {
    // Check if we have enough content to summarize
    if (!meeting.description || meeting.description.trim().length < 10) {
      return "No detailed description available to generate a summary.";
    }

    // Create a prompt for the meeting summary
    const prompt = `
      Please provide a concise summary of the following meeting:
      
      Title: ${meeting.summary}
      Date: ${new Date(meeting.start.dateTime).toLocaleDateString()}
      Time: ${new Date(meeting.start.dateTime).toLocaleTimeString()} - ${new Date(meeting.end.dateTime).toLocaleTimeString()}
      Attendees: ${meeting.attendees?.map(a => a.email).join(', ') || 'None specified'}
      
      Description:
      ${meeting.description}
      
      Please provide a brief summary of the key points and action items in 3-5 sentences.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes meeting notes concisely." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || "Unable to generate summary.";
  } catch (error) {
    console.error('Error generating meeting summary:', error);
    return "Error generating summary. Please try again later.";
  }
}

/**
 * Mock function for generating meeting summaries when OpenAI API is not available
 * @param meeting The meeting to summarize
 * @returns A mock summary of the meeting
 */
export function generateMockMeetingSummary(meeting: CalendarEvent): string {
  // Generate a deterministic but seemingly random summary based on the meeting ID
  const summaries = [
    "Key discussion on project milestones. Team agreed to accelerate timeline. Follow-up meeting scheduled for next week.",
    "Budget review completed with approval for Q4 expenditures. Marketing team to submit revised campaign proposal.",
    "Product roadmap updated with new features prioritized. Engineering team to begin implementation next sprint.",
    "Client feedback reviewed and action items assigned. Customer success team to follow up with detailed responses.",
    "Team brainstorming session resulted in three new initiatives. Project leads assigned and timelines established."
  ];
  
  // Use the meeting ID to select a summary (ensures same meeting gets same summary)
  const index = Math.abs(meeting.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % summaries.length;
  
  return summaries[index];
}
