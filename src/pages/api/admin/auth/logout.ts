import type { APIRoute } from 'astro';
import { getSessionToken, deleteSession, clearSessionCookie } from '../../../../lib/auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const token = getSessionToken(cookies, true);

  if (token) {
    await deleteSession(token, true);
  }

  clearSessionCookie(cookies, true);
  return redirect('/admin/login', 302);
};
