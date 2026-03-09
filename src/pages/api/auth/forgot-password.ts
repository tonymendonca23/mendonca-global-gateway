import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { nanoid } from 'nanoid';
import { sendPasswordResetEmail } from '../../../lib/email';
import { createHash } from 'crypto';
import { isRateLimited, RATE_LIMITS } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate limit specifically by email so bots don't exhaust Resend quota
    const rateLimited = await isRateLimited(`email:${email}`, 'forgot_password', RATE_LIMITS.AUTH_EMAIL.max, RATE_LIMITS.AUTH_EMAIL.windowMinutes);
    if (rateLimited) {
      // Return a 200 generic message anyway to not leak info, but don't send the email
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a reset link will be sent.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Implicitly delete any unused older tokens for this user's email to prevent table clutter
    await db.execute({
      sql: 'DELETE FROM magic_links WHERE email = ? AND used = 0',
      args: [email]
    });

    const emailLower = email.toLowerCase();

    // Check if user exists
    const userResult = await db.execute({
      sql: 'SELECT id, email, name FROM users WHERE email = ?',
      args: [emailLower]
    });

    if (userResult.rows.length === 0) {
      // Return success even if user doesn't exist for security reasons (don't leak emails)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = userResult.rows[0];

    // Create token
    const token = nanoid(32);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

    await db.execute({
      sql: 'INSERT INTO magic_links (id, email, token_hash, is_staff, expires_at, used) VALUES (?, ?, ?, ?, ?, ?)',
      args: [nanoid(), emailLower, tokenHash, 0, expiresAt, 0]
    });

    // Send email
    const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`;

    const emailResult = await sendPasswordResetEmail({
      email: emailLower,
      name: user.name as string,
      resetUrl,
    });

    if (!emailResult.success) {
      ;
      return new Response(JSON.stringify({ success: false, error: 'Failed to send reset email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
