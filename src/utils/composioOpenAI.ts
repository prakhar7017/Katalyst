import { Composio } from "@composio/core";
import { OpenAIProvider } from "@composio/openai";
import OpenAI from "openai";

/**
 * Fetch calendar events using Composio with OpenAI integration
 * @param connectionId The Composio connected account ID
 * @param maxResults Maximum number of events to fetch
 * @returns Object containing upcoming and past events
 */
export async function fetchCalendarEventsWithAI(
  connectionId: string,
  userId: string
) {
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const composio = new Composio({
      apiKey: import.meta.env.VITE_COMPOSIO_API_KEY,
      provider: new OpenAIProvider(),
      baseURL: window.location.hostname.includes('vercel.app') 
        ? `${window.location.protocol}//${window.location.host}/api/composio` 
        : undefined,
    });
    
    console.log('Composio baseURL in fetchCalendarEventsWithAI:', window.location.hostname.includes('vercel.app') 
      ? `${window.location.protocol}//${window.location.host}/api/composio` 
      : 'default');

    console.log(
      `Setting up Composio with OpenAI for connection ID: ${connectionId} and user ID: ${userId}`
    );
    
    // Log the user ID we're using for this request
    console.log(`Using user ID for calendar events: ${userId}`);
    
    // No need to reformat the user ID - we should use exactly what was provided
    // from the authentication flow to maintain consistency
    
    try {
      // First, check if the connected account exists
      const connectedAccounts = await composio.connectedAccounts.list({
        userIds: [userId]
      });
      console.log('Connected accounts for user:', JSON.stringify(connectedAccounts, null, 2));
      
      if (!connectedAccounts || !connectedAccounts.items || connectedAccounts.items.length === 0) {
        console.error(`No connected accounts found for user ID: ${userId}`);
        throw new Error(`No connected accounts found for user ID: ${userId}`);
      }
    } catch (error) {
      console.error('Error checking connected accounts:', error);
      // Continue anyway to see if tools.get works
    }
    
    const tools = await composio.tools.get(userId, {
      tools: ["GOOGLECALENDAR_EVENTS_LIST"],
    });
    
    console.log('Tools retrieved:', JSON.stringify(tools, null, 2));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastStart = new Date(today);
    pastStart.setDate(today.getDate() - 7);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingResponse = await openai.chat.completions.create({
      model: "gpt-4",
      tools: tools,
      messages: [
        {
          role: "user",
          content: `Fetch only events that start strictly after ${today.toISOString()} and before ${nextWeek.toISOString()}. Return only meetings (events with attendees or video links).`,
        },
      ],
      max_tokens: 1024,
    });

    const upcomingResult = await composio.provider.handleToolCalls(
      userId,
      upcomingResponse
    );
    console.log(
      "Upcoming events result:",
      JSON.stringify(upcomingResult, null, 2)
    );

    const upcoming = extractEventsFromToolResponse(upcomingResult);

    const pastResponse = await openai.chat.completions.create({
      model: "gpt-4",
      tools,
      messages: [
        {
          role: "user",
          content: `Fetch only events that ended strictly before ${today.toISOString()} and after ${pastStart.toISOString()}. Return only meetings (events with attendees or video links).`

        },
      ],
      max_tokens: 1024,
    });

    const pastResult = await composio.provider.handleToolCalls(
      userId,
      pastResponse
    );
    console.log("Past events result:", JSON.stringify(pastResult, null, 2));

    
    const past = extractEventsFromToolResponse(pastResult);

    return { upcoming, past };
  } catch (error) {
    console.error("Error fetching calendar events with AI:", error);
    throw error;
  }
}

/**
 * Extract events from the AI result
 * @param result The result from the AI tool call
 * @returns Array of calendar events
 */
/**
 * Extract events from the OpenAI tool response
 * @param result The result from the OpenAI tool call
 * @returns Array of calendar events
 */
import type { ChatCompletionToolMessageParam } from "openai/resources";

interface ToolCallFunction {
  name?: string;
  output?: string;
}

interface ToolCall {
  function?: ToolCallFunction;
}

interface ToolCallsResult {
  toolCalls?: ToolCall[];
  content?: string;
}

function extractEventsFromToolResponse(
  result: ChatCompletionToolMessageParam[] | ToolCallsResult
): Record<string, unknown>[] {
  try {
    if (Array.isArray(result)) {
      for (const message of result) {
        if (
          message.role === "tool" &&
          message.content &&
          typeof message.content === "string"
        ) {
          try {
            const content = JSON.parse(message.content);
            if (content.data && content.data.items) {
              return content.data.items || [];
            }
            return [];
          } catch (e) {
            console.error("Error parsing tool message content:", e);
            return [];
          }
        }
      }
      return [];
    }

    const toolCallsResult = result as ToolCallsResult;
    if (toolCallsResult.toolCalls && toolCallsResult.toolCalls.length > 0) {
      for (const toolCall of toolCallsResult.toolCalls) {
        if (
          toolCall.function &&
          toolCall.function.name === "GOOGLECALENDAR_EVENTS_LIST"
        ) {
          const response = JSON.parse(toolCall.function.output || "{}");
          return response.items || [];
        }
      }
    }

    if (
      toolCallsResult.content &&
      typeof toolCallsResult.content === "string"
    ) {
      const jsonMatch = toolCallsResult.content.match(
        /```json\n([\s\S]*?)\n```/
      );
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsedJson = JSON.parse(jsonMatch[1]);
          return parsedJson.items || parsedJson.events || [];
        } catch (e) {
          console.error("Error parsing JSON in content:", e);
          return [];
        }
      }

      try {
        const parsedContent = JSON.parse(toolCallsResult.content);
        if (parsedContent.data && parsedContent.data.items) {
          return parsedContent.data.items || [];
        }
        return parsedContent.items || parsedContent.events || [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // Not JSON, ignore
      }
    }

    return [];
  } catch (error) {
    console.error("Error extracting events from result:", error);
    return [];
  }
}

/**
 * Get mock calendar events for testing
 * @param maxResults Maximum number of events to return
 * @returns Object containing mock upcoming and past events
 */
export function getMockCalendarEventsWithAI(maxResults: number = 5) {
  const now = new Date();
  const upcoming = [];
  const past = [];

  for (let i = 1; i <= maxResults; i++) {
    const startTime = new Date(now);
    startTime.setDate(now.getDate() + i);
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0);

    upcoming.push({
      id: `upcoming-${i}`,
      summary: `Upcoming Meeting ${i}`,
      description: `This is a mock upcoming meeting ${i}`,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: [
        { email: "attendee1@example.com", displayName: "Attendee 1" },
        { email: "attendee2@example.com", displayName: "Attendee 2" },
      ],
    });
  }

  for (let i = 1; i <= maxResults; i++) {
    const startTime = new Date(now);
    startTime.setDate(now.getDate() - i);
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0);

    past.push({
      id: `past-${i}`,
      summary: `Past Meeting ${i}`,
      description: `This is a mock past meeting ${i}`,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: [
        { email: "attendee1@example.com", displayName: "Attendee 1" },
        { email: "attendee2@example.com", displayName: "Attendee 2" },
      ],
    });
  }

  return { upcoming, past };
}
