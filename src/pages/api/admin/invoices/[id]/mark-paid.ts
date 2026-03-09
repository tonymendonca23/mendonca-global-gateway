import type { APIRoute } from 'astro';
import db from '../../../../../lib/db';

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
    sql: `SELECT id, status FROM invoices WHERE id = ?`,
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

  // Redirect back to admin invoices so the UI updates
  return redirect('/admin/invoices', 303);
};
