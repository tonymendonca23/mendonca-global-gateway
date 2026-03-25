import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { sendBroadcastEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request, locals }) => {
    if (!locals.staff) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { subject, html } = await request.json();

        if (!subject || !html) {
            return new Response(JSON.stringify({ error: 'Subject and message are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch all user emails
        const result = await db.execute(`
      SELECT email FROM users WHERE email IS NOT NULL AND email != ''
    `);

        const emails = result.rows.map(row => row.email as string);
        const validEmails = emails.filter(e => e && e.includes('@'));

        if (validEmails.length === 0) {
            return new Response(JSON.stringify({ error: 'No valid customer emails found' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Trigger the broadcast
        const res = await sendBroadcastEmail(validEmails, subject, html);

        if (!res.success) {
            return new Response(JSON.stringify({ error: res.error || 'Failed to dispatch emails.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            count: validEmails.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Broadcast API Error:', error);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};