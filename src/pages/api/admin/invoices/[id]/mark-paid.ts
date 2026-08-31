import type { APIRoute } from 'astro';
import db from '../../../../../lib/db';
import { creditReferralOnFirstPaidInvoice } from '../../../../../lib/referral';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  // Check auth
  if (!locals.staff) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const invoiceId = params.id;

  if (!invoiceId) {
    return new Response(JSON.stringify({ error: 'Invoice ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify invoice exists and is unpaid
  const invoiceResult = await db.execute({
    sql: `SELECT id, status, customer_id FROM invoices WHERE id = ?`,
    args: [invoiceId],
  });

  const invoice = invoiceResult.rows[0] as any;

  if (!invoice) {
    return new Response(JSON.stringify({ error: 'Invoice not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (invoice.status === 'paid') {
    return new Response(JSON.stringify({ error: 'Invoice is already paid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Mark invoice as paid
  await db.execute({
    sql: `
      UPDATE invoices 
      SET status = 'paid', paid_at = strftime('%s', 'now')
      WHERE id = ?
    `,
    args: [invoiceId],
  });

  // Referral program: if this is the referee's first paid order, award the
  // referrer their $1,000 GYD credit.
  if (invoice.customer_id) {
    try {
      const firstPaidResult = await db.execute({
        sql: `SELECT COUNT(*) as paid_count
              FROM invoices
              WHERE customer_id = ? AND status = 'paid'`,
        args: [invoice.customer_id],
      });

      if (Number((firstPaidResult.rows[0] as any)?.paid_count || 0) === 1) {
        await creditReferralOnFirstPaidInvoice(invoice.customer_id as string);
      }
    } catch (error) {
      console.warn('⚠️ Failed to credit referral after first paid order:', error);
    }
  }

  // Redirect back to admin invoices so the UI updates
  return redirect('/admin/invoices', 303);
};
