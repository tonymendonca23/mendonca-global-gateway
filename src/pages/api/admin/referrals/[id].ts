import type { APIRoute } from 'astro';
import db from '../../../../lib/db';

const ALLOWED_STATUSES = ['pending', 'credited', 'revoked'];

// Admin endpoint: manually apply, adjust or revoke a referral credit.
//
// Body (JSON):
//   status: 'pending' | 'credited' | 'revoked'   (required)
//   credit_amount_gyd: number                     (optional, must be >= 0)
//   notes: string                                 (optional)
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const staff = locals.staff;

  if (!staff) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const referralId = params.id;

  if (!referralId) {
    return new Response(JSON.stringify({ success: false, error: 'Referral ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { status, credit_amount_gyd, notes } = body;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return new Response(JSON.stringify({
      success: false,
      error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (credit_amount_gyd !== undefined) {
    if (typeof credit_amount_gyd !== 'number' || !Number.isFinite(credit_amount_gyd) || credit_amount_gyd < 0) {
      return new Response(JSON.stringify({ success: false, error: 'credit_amount_gyd must be a non-negative number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Fetch the current record
  const existingResult = await db.execute({
    sql: 'SELECT id, referrer_id, referee_id, credit_status FROM referrals WHERE id = ?',
    args: [referralId],
  });

  const referral = existingResult.rows[0] as any;

  if (!referral) {
    return new Response(JSON.stringify({ success: false, error: 'Referral not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const setClauses: string[] = [];
  const args: any[] = [];

  setClauses.push('credit_status = ?');
  args.push(status);

  // Timestamp the credit when it is being applied.
  if (status === 'credited') {
    setClauses.push('credited_at = ?');
    args.push(now);
    setClauses.push('awarded_by = ?');
    args.push(staff.id);
  } else {
    setClauses.push('credited_at = NULL');
    setClauses.push('awarded_by = NULL');
  }

  if (credit_amount_gyd !== undefined) {
    setClauses.push('credit_amount_gyd = ?');
    args.push(credit_amount_gyd);
  }

  if (notes !== undefined) {
    setClauses.push('notes = ?');
    args.push(notes || null);
  }

  args.push(referralId);

  await db.execute({
    sql: `UPDATE referrals SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  return new Response(JSON.stringify({
    success: true,
    message: status === 'credited'
      ? 'Referral credit applied'
      : status === 'revoked'
        ? 'Referral credit revoked'
        : 'Referral set to pending',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
