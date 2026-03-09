import type { APIRoute } from 'astro';
import { verifyEmail } from '../../../lib/auth';
import db from '../../../lib/db';
import { sendWelcomeEmail } from '../../../lib/email';

export const GET: APIRoute = async ({ url, redirect }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect('/auth/login?error=no_verification_token', 302);
  }

  // Verify the email token
  const result = await verifyEmail(token);

  if (!result.success || !result.userId) {
    return redirect('/auth/login?error=invalid_or_expired_verification', 302);
  }

  // Look up user details to send welcome email
  try {
    const userResult = await db.execute({
      sql: 'SELECT email, name, customer_code, us_warehouse_address FROM users WHERE id = ?',
      args: [result.userId]
    });

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      await sendWelcomeEmail({
        email: user.email as string,
        name: user.name as string,
        customerCode: user.customer_code as string | null,
        warehouseAddress: user.us_warehouse_address as string | null,
      });
    }
  } catch (error) {
    ;
  }

  // Redirect to login with success message
  return redirect('/auth/login?verified=true', 302);
};
