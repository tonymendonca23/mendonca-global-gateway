import type { APIRoute } from 'astro';
import { loginWithPassword, createSession, setSessionCookie } from '../../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
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

        // Attempt login
        const result = await loginWithPassword(email, password, true);

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
        const sessionToken = await createSession(result.userId!, true);

        // Set session cookie
        setSessionCookie(cookies, sessionToken, true);

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
