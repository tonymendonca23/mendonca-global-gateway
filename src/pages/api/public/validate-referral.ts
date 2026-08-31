import type { APIRoute } from 'astro';
import { validateReferralCode } from '../../../lib/referral';
import { isRateLimited, getClientIp, RATE_LIMITS } from '../../../lib/rate-limit';

// Public endpoint used by the signup form to live-validate a referral
// Customer Code before submission. Kept read-only and rate-limited so it
// cannot be used to enumerate customer codes.
export const GET: APIRoute = async ({ request, url }) => {
  const ip = getClientIp(request);
  const rateLimited = await isRateLimited(
    ip,
    'validate_referral',
    RATE_LIMITS.VALIDATE_REFERRAL.max,
    RATE_LIMITS.VALIDATE_REFERRAL.windowMinutes
  );

  if (rateLimited) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'Too many requests. Please try again shortly.'
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const code = url.searchParams.get('code') || '';

  if (!code.trim()) {
    return new Response(JSON.stringify({ valid: true, empty: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Note: referee email is unknown at this stage, so self-referral can only
  // be checked server-side during registration. Here we only confirm that
  // the code belongs to an existing customer.
  const result = await validateReferralCode(code);

  if (!result.valid) {
    return new Response(JSON.stringify({
      valid: false,
      error: result.error
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    valid: true,
    referrerName: result.referrerName
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
