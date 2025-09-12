import { neon } from '@neondatabase/serverless';

// Database connection string - in production, this would be an environment variable
// For development, we'll use a placeholder that should be replaced with your actual Neon DB URL
const NEON_DB_URL = process.env.NEON_DB_URL || 'postgresql://user:password@your-neon-db-url.neon.tech/neondb';

// Create a SQL client
const sql = neon(NEON_DB_URL);

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        picture TEXT,
        access_token TEXT,
        refresh_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create meetings table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        description TEXT,
        location TEXT,
        attendees JSONB,
        summary TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// User operations
export async function createOrUpdateUser(user: {
  id: string;
  name: string;
  email: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO users (id, name, email, picture, access_token, refresh_token)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${user.picture}, ${user.accessToken}, ${user.refreshToken})
      ON CONFLICT (id) DO UPDATE SET
        name = ${user.name},
        email = ${user.email},
        picture = ${user.picture},
        access_token = ${user.accessToken},
        refresh_token = ${user.refreshToken},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to create or update user:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    throw error;
  }
}

// Meeting operations
export async function saveMeeting(meeting: {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
  attendees?: any[];
  summary?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO meetings (
        id, user_id, title, start_time, end_time, 
        description, location, attendees, summary
      )
      VALUES (
        ${meeting.id}, ${meeting.userId}, ${meeting.title}, 
        ${meeting.startTime}, ${meeting.endTime}, 
        ${meeting.description}, ${meeting.location}, 
        ${JSON.stringify(meeting.attendees || [])}, ${meeting.summary}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = ${meeting.title},
        start_time = ${meeting.startTime},
        end_time = ${meeting.endTime},
        description = ${meeting.description},
        location = ${meeting.location},
        attendees = ${JSON.stringify(meeting.attendees || [])},
        summary = ${meeting.summary},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to save meeting:', error);
    throw error;
  }
}

export async function getMeetingsByUserId(userId: string, limit: number = 10, isPast: boolean = false) {
  const now = new Date();
  
  try {
    let query;
    if (isPast) {
      // Get past meetings, ordered by most recent first
      query = sql`
        SELECT * FROM meetings 
        WHERE user_id = ${userId} AND end_time < ${now}
        ORDER BY end_time DESC
        LIMIT ${limit}
      `;
    } else {
      // Get upcoming meetings, ordered by soonest first
      query = sql`
        SELECT * FROM meetings 
        WHERE user_id = ${userId} AND start_time > ${now}
        ORDER BY start_time ASC
        LIMIT ${limit}
      `;
    }
    
    return await query;
  } catch (error) {
    console.error('Failed to get meetings by user ID:', error);
    throw error;
  }
}

export { sql };
