import { neon } from '@neondatabase/serverless';

const NEON_DB_URL = import.meta.env.VITE_NEON_DB_URL || 'postgresql://user:password@your-neon-db-url.neon.tech/neondb';

console.log(`Database connection: ${NEON_DB_URL.includes('postgresql') ? 'Configured' : 'Using fallback'}`);

const sql = neon(NEON_DB_URL);

export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        picture TEXT,
        access_token TEXT,
        refresh_token TEXT,
        connection_id TEXT,
        app_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connection_id TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS app_name TEXT`;
      console.log('Added new columns to users table if needed');
    } catch (columnError) {
      console.warn('Error adding columns (may already exist):', columnError);
    }

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

export async function createOrUpdateUser(user: {
  id: string;
  connectionId?: string;
  appName?: string  
}) {      
  try {
    const result = await sql`
      INSERT INTO users (id, connection_id, app_name)
      VALUES (${user.id}, ${user.connectionId}, ${user.appName})
      ON CONFLICT (id) DO UPDATE SET
        id = ${user.id},
        connection_id = ${user.connectionId},
        app_name = ${user.appName},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to create or update user:', error);
    throw error;
  }
}

export async function getUserById(connection_id: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE connection_id = ${connection_id}
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
  attendees?: Array<{email: string; name?: string; response?: string}>;
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
