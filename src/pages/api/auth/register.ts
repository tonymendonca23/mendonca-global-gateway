import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { hashPassword, sendVerificationEmail } from '../../../lib/auth';
import db from '../../../lib/db';
import { generateWarehouseAddress } from '../../../lib/warehouse';
import { isRateLimited, getClientIp, RATE_LIMITS } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const ip = getClientIp(request);
    const rateLimited = await isRateLimited(ip, 'register', RATE_LIMITS.REGISTER.max, RATE_LIMITS.REGISTER.windowMinutes);

    if (rateLimited) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many registration attempts. Please try again later.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { firstName, lastName, email, password, phone, address, city } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !city) {
      return new Response(JSON.stringify({
        success: false,
        error: 'All fields are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase()],
    });

    if (existingUser.rows.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'An account with this email already exists. Please log in.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = nanoid();
    const now = Math.floor(Date.now() / 1000);

    // Generate unique customer code like MGG123456
    let customerCode = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `MGG${Math.floor(100000 + Math.random() * 900000)}`;
      const codeCheck = await db.execute({
        sql: 'SELECT id FROM users WHERE customer_code = ?',
        args: [candidate],
      });
      if (codeCheck.rows.length === 0) {
        customerCode = candidate;
        break;
      }
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const warehouseAddress = generateWarehouseAddress(fullName, customerCode || null);

    await db.execute({
      sql: `INSERT INTO users (id, email, password, name, phone, address, customer_code, branch_preference, us_warehouse_address, email_verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        email.toLowerCase(),
        hashedPassword,
        fullName,
        phone,
        address || null,
        customerCode || null,
        city.toLowerCase(),
        warehouseAddress,
        0, // email_verified = false
        now,
      ],
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email.toLowerCase(), userId);

    if (!emailResult.success) {
      console.warn('⚠️ Warning:', emailResult.error);
      // Still return success but warn about email
      return new Response(JSON.stringify({
        success: true,
        userId,
        warning: 'Account created but failed to send verification email. Please contact support.',
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      message: 'Please check your email to verify your account before logging in.',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'An error occurred during registration',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
