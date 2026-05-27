import type { APIRoute } from 'astro';
import db from '../../../../../lib/db';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
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

  // Verify invoice exists before attempting delete
  const invoiceResult = await db.execute({
    sql: `SELECT id, invoice_number FROM invoices WHERE id = ?`,
    args: [invoiceId],
  });

  const invoice = invoiceResult.rows[0] as any;

  if (!invoice) {
    return new Response(JSON.stringify({ error: 'Invoice not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete the invoice — invoice_line_items cascade automatically via FK
  await db.execute({
    sql: `DELETE FROM invoices WHERE id = ?`,
    args: [invoiceId],
  });

  return redirect('/admin/invoices', 303);
};
