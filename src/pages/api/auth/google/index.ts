import type { APIRoute } from 'astro';

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
const PUBLIC_SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  if (!GOOGLE_CLIENT_ID) {
    return new Response(JSON.stringify({ error: 'Google OAuth not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const redirectUri = `${PUBLIC_SITE_URL}/api/auth/google/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    prompt: 'select_account',
    access_type: 'offline',
  });

  // Store state in a cookie for CSRF protection using Astro's cookies API
  cookies.set('oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    secure: import.meta.env.PROD,
  });

  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
};
