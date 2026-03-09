import type { APIRoute } from 'astro';
import db from '../../../../../lib/db';
import { createSession, setSessionCookie } from '../../../../../lib/auth';

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
    return redirect(`/admin/login?error=${encodeURIComponent(error)}`, 302);
  }

  // Validate state for CSRF protection
  const storedState = cookies.get('admin_oauth_state')?.value;
  if (!state || state !== storedState) {
    return redirect('/admin/login?error=invalid_state', 302);
  }

  // Clear the state cookie
  cookies.delete('admin_oauth_state', { path: '/' });

  if (!code) {
    return redirect('/admin/login?error=no_code', 302);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return redirect('/admin/login?error=oauth_not_configured', 302);
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
        redirect_uri: `${PUBLIC_SITE_URL}/api/admin/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      ;
      return redirect('/admin/login?error=token_exchange_failed', 302);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      ;
      return redirect('/admin/login?error=user_info_failed', 302);
    }

    const userInfo: GoogleUserInfo = await userResponse.json();

    if (!userInfo.email) {
      return redirect('/admin/login?error=no_email', 302);
    }

    // Check if staff exists with this email
    const staffResult = await db.execute({
      sql: 'SELECT id, name, role, is_active FROM staff WHERE email = ?',
      args: [userInfo.email.toLowerCase()],
    });

    if (staffResult.rows.length === 0) {
      return redirect('/admin/login?error=not_authorized', 302);
    }

    const staff = staffResult.rows[0] as any;

    if (staff.is_active !== 1) {
      return redirect('/admin/login?error=account_disabled', 302);
    }

    // Create admin session
    const sessionToken = await createSession(staff.id, true);

    // Set admin session cookie
    setSessionCookie(cookies, sessionToken, true);

    // Redirect to admin dashboard
    return redirect('/admin', 302);
  } catch (err) {
    ;
    return redirect('/admin/login?error=oauth_error', 302);
  }
};
