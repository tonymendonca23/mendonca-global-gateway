import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';
import { createHash } from 'crypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Token and new password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ success: false, error: 'Password must be at least 8 characters long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const now = Math.floor(Date.now() / 1000);

    // Find and validate token
    const tokenResult = await db.execute({
      sql: 'SELECT id, email, is_staff FROM magic_links WHERE token_hash = ? AND used = 0 AND expires_at > ?',
      args: [tokenHash, now]
    });

    if (tokenResult.rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resetToken = tokenResult.rows[0];
    const hashedPassword = await hashPassword(password);

    // Update password
    if (resetToken.is_staff) {
      await db.execute({
        sql: 'UPDATE staff SET password = ? WHERE email = ?',
        args: [hashedPassword, resetToken.email]
      });
    } else {
      await db.execute({
        sql: 'UPDATE users SET password = ? WHERE email = ?',
        args: [hashedPassword, resetToken.email]
      });
    }

    // Mark token as used
    await db.execute({
      sql: 'UPDATE magic_links SET used = 1 WHERE id = ?',
      args: [resetToken.id]
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    ;
    return new Response(JSON.stringify({ success: false, error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
