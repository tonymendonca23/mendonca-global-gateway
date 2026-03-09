import type { APIRoute } from 'astro';
import { getSessionToken, deleteSession, clearSessionCookie } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const token = getSessionToken(cookies, false);

  if (token) {
    await deleteSession(token, false);
  }

  clearSessionCookie(cookies, false);
  return redirect('/auth/login', 302);
};
