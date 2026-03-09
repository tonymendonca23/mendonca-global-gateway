import type { APIRoute } from 'astro';
import { loginWithPassword, createSession, setSessionCookie } from '../../../lib/auth';
import { isRateLimited, getClientIp, RATE_LIMITS } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const ip = getClientIp(request);
        const rateLimited = await isRateLimited(ip, 'login', RATE_LIMITS.LOGIN.max, RATE_LIMITS.LOGIN.windowMinutes);

        if (rateLimited) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Too many login attempts. Please wait 15 minutes and try again.'
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Email and password are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Attempt login (customer login, isStaff = false)
        const result = await loginWithPassword(email, password, false);

        if (!result.success) {
            return new Response(JSON.stringify({
                success: false,
                error: result.error
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create session
        const sessionToken = await createSession(result.userId!, false);

        // Set session cookie
        setSessionCookie(cookies, sessionToken, false);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        ;
        return new Response(JSON.stringify({
            success: false,
            error: 'An error occurred during login'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
