import { nanoid } from 'nanoid';
import db from './db';

// Reward granted to a referrer for each successful referral signup.
// Stored as GYD (Guyanese Dollars).
export const REFERRAL_CREDIT_GYD = 1000;

export type ReferralCreditStatus = 'pending' | 'credited' | 'revoked';

/**
 * Generate a unique customer code in the MGG + 6 digits format (e.g.
 * MGG123456). This is the public "Customer Code" customers share as their
 * referral code. Retries on the rare chance of a collision with an
 * existing code.
 */
export async function generateUniqueCustomerCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `MGG${Math.floor(100000 + Math.random() * 900000)}`;
    const check = await db.execute({
      sql: 'SELECT id FROM users WHERE customer_code = ?',
      args: [candidate],
    });
    if (check.rows.length === 0) {
      return candidate;
    }
  }
  throw new Error('Unable to generate a unique customer code');
}

/**
 * Ensure a user has a customer code, assigning one if missing. Used by
 * signup paths that don't go through the password registration flow
 * (Google OAuth and magic links). Returns the code now assigned.
 */
export async function ensureCustomerCode(userId: string): Promise<string | null> {
  const result = await db.execute({
    sql: 'SELECT customer_code FROM users WHERE id = ?',
    args: [userId],
  });

  const existing = result.rows[0]?.customer_code as string | null | undefined;

  if (existing) {
    return existing;
  }

  const code = await generateUniqueCustomerCode();
  await db.execute({
    sql: 'UPDATE users SET customer_code = ? WHERE id = ?',
    args: [code, userId],
  });

  return code;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string | null;
  credit_amount_gyd: number;
  credit_status: ReferralCreditStatus;
  credited_at: number | null;
  awarded_by: string | null;
  notes: string | null;
  created_at: number;
}

/**
 * Resolve a referral code (Customer Code such as "MGG123456") to the user it
 * belongs to. Matching is case-insensitive and tolerates surrounding
 * whitespace. Returns null when no user owns the code.
 */
export async function findUserByReferralCode(code: string) {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const result = await db.execute({
    sql: 'SELECT id, customer_code, name FROM users WHERE UPPER(customer_code) = ?',
    args: [normalized],
  });

  return (result.rows[0] as any) || null;
}

export interface ValidateReferralResult {
  valid: boolean;
  referrerId?: string;
  referrerName?: string;
  referralCode?: string;
  error?: string;
}

/**
 * Validate a referral code entered during signup.
 *
 * Rules:
 * - Empty / whitespace codes are treated as "no referral" (valid but ignored).
 * - The code must belong to an existing customer.
 * - When the prospective referee's email is known, self-referral is blocked
 *   (the referrer cannot be the same person who is signing up).
 */
export async function validateReferralCode(
  code: string | null | undefined,
  refereeEmail?: string
): Promise<ValidateReferralResult> {
  const trimmed = (code || '').trim();

  if (!trimmed) {
    // Optional field left blank: nothing to validate.
    return { valid: true };
  }

  const referrer = await findUserByReferralCode(trimmed);

  if (!referrer) {
    return {
      valid: false,
      error: 'That Customer Code was not found. Please double-check it with your friend.',
    };
  }

  // Prevent self-referral: the referrer must not be the person signing up.
  if (refereeEmail) {
    const emailMatch = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ? AND email = ?',
      args: [referrer.id, refereeEmail.toLowerCase()],
    });

    if (emailMatch.rows.length > 0) {
      return {
        valid: false,
        error: 'You cannot refer yourself. Please leave this field blank or use a different Customer Code.',
      };
    }
  }

  return {
    valid: true,
    referrerId: referrer.id as string,
    referrerName: referrer.name as string,
    referralCode: referrer.customer_code as string,
  };
}

/**
 * Record a referral relationship after a successful registration.
 * Safe to call repeatedly: if the referee already has a referral record it
 * is left untouched.
 */
export async function recordReferral(params: {
  referrerId: string;
  refereeId: string;
  referralCode?: string;
}): Promise<Referral | null> {
  const { referrerId, refereeId, referralCode } = params;

  if (!referrerId || !refereeId || referrerId === refereeId) {
    return null;
  }

  // One referral per referee (UNIQUE constraint also enforces this).
  const existing = await db.execute({
    sql: 'SELECT id FROM referrals WHERE referee_id = ?',
    args: [refereeId],
  });

  if (existing.rows.length > 0) {
    return null;
  }

  const referralId = nanoid();
  const now = Math.floor(Date.now() / 1000);

  await db.execute({
    sql: `INSERT INTO referrals (id, referrer_id, referee_id, referral_code, credit_amount_gyd, credit_status, created_at)
          VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    args: [referralId, referrerId, refereeId, referralCode || null, REFERRAL_CREDIT_GYD, now],
  });

  // Keep the denormalized pointer on the users row in sync as well.
  await db.execute({
    sql: 'UPDATE users SET referred_by_id = ? WHERE id = ?',
    args: [referrerId, refereeId],
  });

  return {
    id: referralId,
    referrer_id: referrerId,
    referee_id: refereeId,
    referral_code: referralCode || null,
    credit_amount_gyd: REFERRAL_CREDIT_GYD,
    credit_status: 'pending',
    credited_at: null,
    awarded_by: null,
    notes: null,
    created_at: now,
  };
}

/**
 * Award the referral credit once the referee places and pays for their
 * first order. Called from the invoice payment flow; the caller must have
 * already verified that the paid invoice belongs to the referee and that
 * it is their first paid invoice. Idempotent: only 'pending' referrals are
 * credited. There is no cap on referrals per referrer.
 */
export async function creditReferralOnFirstPaidInvoice(refereeId: string): Promise<boolean> {
  const result = await db.execute({
    sql: `UPDATE referrals
          SET credit_status = 'credited', credited_at = ?, awarded_by = NULL, notes = COALESCE(notes, 'Credited automatically after referee paid their first order')
          WHERE referee_id = ? AND credit_status = 'pending'`,
    args: [Math.floor(Date.now() / 1000), refereeId],
  });

  return (result.rowsAffected || 0) > 0;
}

export interface ReferralStats {
  totalReferrals: number;
  creditedReferrals: number;
  pendingReferrals: number;
  totalCreditsGyd: number;
}

/**
 * Aggregate referral metrics for a single referrer.
 */
export async function getReferralStatsForReferrer(referrerId: string): Promise<ReferralStats> {
  const result = await db.execute({
    sql: `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN credit_status = 'credited' THEN 1 ELSE 0 END) as credited,
            SUM(CASE WHEN credit_status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN credit_status = 'credited' THEN credit_amount_gyd ELSE 0 END) as total_credits
          FROM referrals
          WHERE referrer_id = ?`,
    args: [referrerId],
  });

  const row = result.rows[0] as any;

  return {
    totalReferrals: Number(row?.total || 0),
    creditedReferrals: Number(row?.credited || 0),
    pendingReferrals: Number(row?.pending || 0),
    totalCreditsGyd: Number(row?.total_credits || 0),
  };
}
