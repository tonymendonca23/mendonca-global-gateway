import type { APIRoute } from 'astro';
import { sendVerificationEmail } from '../../../lib/auth';
import db from '../../../lib/db';
import { isRateLimited, RATE_LIMITS } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rateLimited = await isRateLimited(`email:verify:${email}`, 'resend_verification', RATE_LIMITS.AUTH_EMAIL.max, RATE_LIMITS.AUTH_EMAIL.windowMinutes);
    if (rateLimited) {
      return new Response(JSON.stringify({
        success: true, // Fail silent
        message: 'Verification email sent successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete existing un-used verification tokens for this user first
    await db.execute({
      sql: 'DELETE FROM magic_links WHERE email = ? AND used = 0',
      args: [email]
    });

    // Check if user exists and is not verified
    const userResult = await db.execute({
      sql: 'SELECT id, email_verified FROM users WHERE email = ?',
      args: [email.toLowerCase()],
    });

    if (userResult.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No account found with this email address'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = userResult.rows[0] as any;

    if (user.email_verified) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This email is already verified. Please log in.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send verification email
    const result = await sendVerificationEmail(email.toLowerCase(), user.id);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Verification email sent! Please check your inbox.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Failed to send verification email'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    ;
    return new Response(JSON.stringify({
      success: false,
      error: 'An error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
