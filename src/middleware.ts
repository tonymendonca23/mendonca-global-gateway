import { getSessionToken, validateSession, hashToken } from './lib/auth';
import db from './lib/db';
import type { APIContext, MiddlewareNext } from 'astro';

// Define paths that don't require authentication
const publicPaths = ['/', '/auth/login', '/auth/verify', '/admin/login', '/admin/auth/verify'];

// Inactivity timeout (7 days in seconds)
const INACTIVITY_TIMEOUT = 7 * 24 * 60 * 60; // 7 days in seconds

export async function onRequest(context: APIContext, next: MiddlewareNext) {
  const { url, cookies, redirect, locals } = context;
  const pathname = url.pathname;

  // Check if path is public API route (auth endpoints, tracking, admin auth)
  if (pathname.startsWith('/api/track/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/admin/auth/') ||
    pathname.startsWith('/api/invoices/')) {
    return next();
  }

  // Check if path is public
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/public/')) {
    // Check if user is already logged in and trying to access login page
    if (pathname === '/auth/login') {
      const token = getSessionToken(cookies, false);
      if (token) {
        const session = await validateSession(token, false);
        if (session.valid && session.userId) {
          return redirect('/dashboard', 302);
        }
      }
    }
    // Check if admin is already logged in and trying to access admin login page
    if (pathname === '/admin/login') {
      const token = getSessionToken(cookies, true);
      if (token) {
        const session = await validateSession(token, true);
        if (session.valid && session.userId) {
          return redirect('/admin', 302);
        }
      }
    }
    return next();
  }

  // Customer protected routes (exclude admin APIs)
  if (
    pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/'))
  ) {
    const token = getSessionToken(cookies, false);

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/auth/login', 302);
    }

    const session = await validateSession(token, false);

    if (!session.valid || !session.userId) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/auth/login', 302);
    }

    // Check inactivity timeout
    const activityResult = await db.execute({
      sql: 'SELECT last_activity FROM users WHERE id = ?',
      args: [session.userId],
    });

    if (activityResult.rows.length > 0) {
      const lastActivity = activityResult.rows[0].last_activity as number | null;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastActivity = lastActivity ? currentTime - lastActivity : 0;

      if (lastActivity && timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        // Delete the session
        await db.execute({
          sql: 'DELETE FROM sessions WHERE user_id = ? AND token_hash = ?',
          args: [session.userId, hashToken(token)],
        });

        if (pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Session expired due to inactivity' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return redirect('/auth/login', 302);
      }

      // Update last activity timestamp
      await db.execute({
        sql: 'UPDATE users SET last_activity = ? WHERE id = ?',
        args: [currentTime, session.userId],
      });
    }

    // Get user info
    const userResult = await db.execute({
      sql: 'SELECT id, email, phone, name, address, customer_code, us_warehouse_address, branch_preference, created_at FROM users WHERE id = ?',
      args: [session.userId],
    });

    if (userResult.rows.length === 0) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/auth/login', 302);
    }

    locals.user = userResult.rows[0] as any;
    return next();
  }

  // Admin protected routes (admin pages + admin APIs)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')) {
    const token = getSessionToken(cookies, true);

    if (!token) {
      if (pathname.startsWith('/api/admin/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/admin/login', 302);
    }

    const session = await validateSession(token, true);

    if (!session.valid || !session.userId) {
      if (pathname.startsWith('/api/admin/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/admin/login', 302);
    }

    // Get staff info
    const staffResult = await db.execute({
      sql: 'SELECT id, email, name, role FROM staff WHERE id = ? AND is_active = 1',
      args: [session.userId],
    });

    if (staffResult.rows.length === 0) {
      if (pathname.startsWith('/api/admin/')) {
        return new Response(JSON.stringify({ error: 'Staff not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/admin/login', 302);
    }

    locals.staff = staffResult.rows[0] as any;
    return next();
  }

  return next();
}

export { };
