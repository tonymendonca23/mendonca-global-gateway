import db from './db';
import { nanoid } from 'nanoid';

// General rate limits
export const RATE_LIMITS = {
  // Max 5 login attempts per 15 minutes per IP
  LOGIN: { max: 5, windowMinutes: 15 },
  // Max 3 registrations per 1 hour per IP
  REGISTER: { max: 3, windowMinutes: 60 },
  // Max 3 password resets/magic links per 1 hour per Email
  AUTH_EMAIL: { max: 3, windowMinutes: 60 },
};

/**
 * Checks if a given identifier has exceeded the rate limit for a specific action.
 * Returns true if rate limited (blocked), false otherwise (allowed).
 */
export async function isRateLimited(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMinutes: number
): Promise<boolean> {
  const windowStartThreshold = Math.floor(Date.now() / 1000) - (windowMinutes * 60);

  try {
    // Check existing rate limit
    const result = await db.execute({
      sql: 'SELECT id, request_count, window_start FROM rate_limits WHERE identifier = ? AND action = ?',
      args: [identifier, action]
    });

    if (result.rows.length === 0) {
      // First time we're seeing this identifier/action combo
      await db.execute({
        sql: `INSERT INTO rate_limits (id, identifier, action, request_count, window_start) 
              VALUES (?, ?, ?, 1, ?)`,
        args: [nanoid(), identifier, action, Math.floor(Date.now() / 1000)]
      });
      return false;
    }

    const row = result.rows[0];
    const requestCount = row.request_count as number;
    const windowStart = row.window_start as number;

    // Has the window expired?
    if (windowStart < windowStartThreshold) {
      // Reset the window
      await db.execute({
        sql: 'UPDATE rate_limits SET request_count = 1, window_start = ?, updated_at = unixepoch() WHERE id = ?',
        args: [Math.floor(Date.now() / 1000), row.id]
      });
      return false;
    }

    // Still within the window, check request count
    if (requestCount >= maxRequests) {
      // Rate limited
      return true;
    }

    // Not rate limited, increment counter
    await db.execute({
      sql: 'UPDATE rate_limits SET request_count = request_count + 1, updated_at = unixepoch() WHERE id = ?',
      args: [row.id]
    });
    return false;

  } catch (error) {
    ;
    // On db error, let the request through but log it so we don't block legit requests unnecessarily
    return false;
  }
}

/**
 * Helper to get IP address from Request
 */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown-ip';
}