import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { getReferralStatsForReferrer } from '../../lib/referral';

// Returns the signed-in customer's referral program metrics:
// their referral code (Customer Code), totals, and a list of the friends
// who signed up using their ID.
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const stats = await getReferralStatsForReferrer(user.id);

    const referralsResult = await db.execute({
      sql: `SELECT
              r.credit_status,
              r.credit_amount_gyd,
              r.created_at,
              u.name as referee_name
            FROM referrals r
            LEFT JOIN users u ON u.id = r.referee_id
            WHERE r.referrer_id = ?
            ORDER BY r.created_at DESC`,
      args: [user.id],
    });

    return new Response(JSON.stringify({
      success: true,
      referralCode: user.customer_code,
      stats,
      referrals: referralsResult.rows,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to load referral details'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
