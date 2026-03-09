import type { APIRoute } from 'astro';
import db from '../../../../lib/db';
import { getSessionToken, validateSession, verifyInvoiceFileToken } from '../../../../lib/auth';

export const GET: APIRoute = async ({ request, params, cookies }) => {
    const id = params.id;

    if (!id) {
        return new Response('Missing invoice id', { status: 400 });
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const expiresParam = url.searchParams.get('expires');

    let hasValidToken = false;

    if (token && expiresParam) {
        const expires = Number(expiresParam);
        if (!Number.isNaN(expires) && verifyInvoiceFileToken(id, token, expires)) {
            hasValidToken = true;
        } else {
            return new Response('Invalid or expired link', { status: 403 });
        }
    }

    // Allow either a valid signed token, an authenticated customer, or an authenticated admin
    let isAdmin = false;
    let userId: string | undefined;

    if (!hasValidToken) {
        const adminToken = getSessionToken(cookies, true);
        if (adminToken) {
            const session = await validateSession(adminToken, true);
            if (session.valid && session.userId) {
                isAdmin = true;
            }
        }

        if (!isAdmin) {
            const userToken = getSessionToken(cookies, false);
            if (userToken) {
                const session = await validateSession(userToken, false);
                if (session.valid && session.userId) {
                    userId = session.userId;
                }
            }
        }

        if (!isAdmin && !userId) {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    const result = await db.execute({
        sql: `SELECT id, customer_id, invoice_file_data, invoice_file_name, invoice_file_mime, invoice_file_size 
          FROM invoices WHERE id = ?`,
        args: [id],
    });

    if (result.rows.length === 0) {
        return new Response('Invoice not found', { status: 404 });
    }

    const row = result.rows[0] as any;

    if (!row.invoice_file_data) {
        return new Response('Invoice PDF not found', { status: 404 });
    }

    if (!hasValidToken && !isAdmin && row.customer_id !== userId) {
        return new Response('Forbidden', { status: 403 });
    }

    const mimeType = (row.invoice_file_mime as string) || 'application/pdf';
    const fileName = (row.invoice_file_name as string) || `invoice-${row.id}.pdf`;
    const size = row.invoice_file_size as number | null;

    const body = row.invoice_file_data as Uint8Array;

    const headers: Record<string, string> = {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    };

    if (typeof size === 'number' && !Number.isNaN(size)) {
        headers['Content-Length'] = String(size);
    }

    return new Response(body, {
        status: 200,
        headers,
    });
};
