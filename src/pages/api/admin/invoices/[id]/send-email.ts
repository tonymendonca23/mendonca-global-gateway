import type { APIRoute } from 'astro';
import db from '../../../../../lib/db';
import { sendInvoiceEmail } from '../../../../../lib/email';
import { createInvoiceFileLink } from '../../../../../lib/auth';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
    if (!locals.staff) {
        return new Response('Unauthorized', { status: 401 });
    }

    const id = params.id;
    if (!id) {
        return new Response('Missing invoice id', { status: 400 });
    }

    const result = await db.execute({
        sql: `
      SELECT 
        i.invoice_number,
        i.total_gyd,
                i.invoice_file_url,
                i.invoice_file_size,
        u.email AS customer_email,
        u.name AS customer_name
      FROM invoices i
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.id = ?
    `,
        args: [id],
    });

    const row = result.rows[0] as any;
    if (!row) {
        return new Response('Invoice not found', { status: 404 });
    }

    if (!row.customer_email) {
        return new Response('Customer email missing', { status: 400 });
    }

    const hasBlob = row.invoice_file_size && Number(row.invoice_file_size) > 0;
    const hasLegacyUrl = !!row.invoice_file_url;

    if (!hasBlob && !hasLegacyUrl) {
        return redirect(`/admin/invoices/${id}?error=no-pdf`, 303);
    }

    const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    let invoiceUrl: string;

    if (hasBlob) {
        // Generate a signed, time-limited link to the invoice PDF
        invoiceUrl = createInvoiceFileLink(id, siteUrl);
    } else {
        // Fallback to legacy URL if a blob is not available
        invoiceUrl = new URL(row.invoice_file_url as string, siteUrl).toString();
    }

    await sendInvoiceEmail({
        email: row.customer_email,
        name: row.customer_name,
        invoiceNumber: row.invoice_number,
        totalGyd: row.total_gyd || 0,
        invoiceUrl,
    });

    return redirect(`/admin/invoices/${id}?sent=1`, 303);
};
