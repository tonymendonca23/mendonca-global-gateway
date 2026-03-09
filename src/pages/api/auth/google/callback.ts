import type { APIRoute } from 'astro';
import db from '../../../../lib/db';
import { nanoid } from 'nanoid';
import { createSession, setSessionCookie } from '../../../../lib/auth';

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET;
const PUBLIC_SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');


  // Check for OAuth errors
  if (error) {
    ;
    return redirect(`/auth/login?error=${encodeURIComponent(error)}`, 302);
  }

  // Validate state for CSRF protection
  const storedState = cookies.get('oauth_state')?.value;

  if (!state || state !== storedState) {
    ;
    return redirect('/auth/login?error=invalid_state', 302);
  }

  // Clear the state cookie
  cookies.delete('oauth_state', { path: '/' });

  if (!code) {
    return redirect('/auth/login?error=no_code', 302);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return redirect('/auth/login?error=oauth_not_configured', 302);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${PUBLIC_SITE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      ;
      return redirect('/auth/login?error=token_exchange_failed', 302);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      ;
      return redirect('/auth/login?error=user_info_failed', 302);
    }

    const userInfo: GoogleUserInfo = await userResponse.json();

    if (!userInfo.email) {
      return redirect('/auth/login?error=no_email', 302);
    }

    // Check if user exists
    let userResult = await db.execute({
      sql: 'SELECT id, email_verified FROM users WHERE email = ?',
      args: [userInfo.email.toLowerCase()],
    });

    let userId: string;

    if (userResult.rows.length === 0) {
      // Create new user with email verified (Google has verified the email)
      userId = nanoid();
      await db.execute({
        sql: `INSERT INTO users (id, email, name, email_verified, created_at) VALUES (?, ?, ?, ?, strftime('%s', 'now'))`,
        args: [userId, userInfo.email.toLowerCase(), userInfo.name || '', 1],
      });
    } else {
      userId = userResult.rows[0].id as string;
      const emailVerified = userResult.rows[0].email_verified as number;

      // Check if email is verified
      if (!emailVerified) {
        // Auto-verify if Google has verified the email
        if (userInfo.verified_email) {
          await db.execute({
            sql: 'UPDATE users SET email_verified = 1 WHERE id = ?',
            args: [userId],
          });
        } else {
          // User needs to verify their email first
          return redirect('/auth/login?error=email_not_verified', 302);
        }
      }

      // Update name if it was empty
      if (userInfo.name) {
        await db.execute({
          sql: 'UPDATE users SET name = ? WHERE id = ? AND (name IS NULL OR name = "")',
          args: [userInfo.name, userId],
        });
      }
    }

    // Create session
    const sessionToken = await createSession(userId, false);

    // Set session cookie
    setSessionCookie(cookies, sessionToken, false);

    // Redirect to dashboard
    return redirect('/dashboard', 302);
  } catch (err) {
    ;
    return redirect('/auth/login?error=oauth_error', 302);
  }
};
