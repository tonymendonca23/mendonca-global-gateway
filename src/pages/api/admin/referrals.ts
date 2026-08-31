import type { APIRoute } from 'astro';
import db from '../../../lib/db';

// Admin endpoint: full referral log with referrer/referee details.
// Optional query params: status=pending|credited|revoked, limit, offset.
export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.staff) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const status = url.searchParams.get('status');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let sql = `
    SELECT
      r.id,
      r.referral_code,
      r.credit_amount_gyd,
      r.credit_status,
      r.credited_at,
      r.notes,
      r.created_at,
      referrer.name AS referrer_name,
      referrer.customer_code AS referrer_customer_code,
      referee.name AS referee_name,
      referee.customer_code AS referee_customer_code,
      referee.email AS referee_email
    FROM referrals r
    LEFT JOIN users referrer ON referrer.id = r.referrer_id
    LEFT JOIN users referee ON referee.id = r.referee_id
  `;

  const args: any[] = [];

  if (status) {
    sql += ' WHERE r.credit_status = ?';
    args.push(status);
  }

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const [referralsResult, totalsResult] = await Promise.all([
    db.execute({ sql, args }),
    db.execute({
      sql: `SELECT
              COUNT(*) as total,
              SUM(CASE WHEN credit_status = 'credited' THEN 1 ELSE 0 END) as credited,
              SUM(CASE WHEN credit_status = 'pending' THEN 1 ELSE 0 END) as pending,
              SUM(CASE WHEN credit_status = 'credited' THEN credit_amount_gyd ELSE 0 END) as total_credits_gyd
            FROM referrals`,
      args: [],
    }),
  ]);

  return new Response(JSON.stringify({
    success: true,
    referrals: referralsResult.rows,
    totals: totalsResult.rows[0],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
