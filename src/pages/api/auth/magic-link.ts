import type { APIRoute } from 'astro';
import { sendMagicLinkEmail } from '../../../lib/auth';
import { isRateLimited, RATE_LIMITS } from '../../../lib/rate-limit';
import db from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Rate limit specifically by email so bots don't exhaust Resend quota
    const rateLimited = await isRateLimited(`email:${email}`, 'magic_link', RATE_LIMITS.AUTH_EMAIL.max, RATE_LIMITS.AUTH_EMAIL.windowMinutes);
    if (rateLimited) {
      // Return a 200 generic message anyway to not leak info, but don't send the email
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account exists, a magic link has been sent to your email.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete unused previous magic links
    await db.execute({
      sql: 'DELETE FROM magic_links WHERE email = ? AND used = 0',
      args: [email]
    });

    const result = await sendMagicLinkEmail(email.toLowerCase().trim(), false);

    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Failed to send magic link'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'An error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
