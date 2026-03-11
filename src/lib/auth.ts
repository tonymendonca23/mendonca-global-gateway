import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';
import db from './db';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const AUTH_SECRET = import.meta.env.AUTH_SECRET || 'dev-secret-change-in-production';

// Token generation
export function generateToken(): string {
  return nanoid(32);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Password Login
export async function loginWithPassword(
  email: string,
  password: string,
  isStaff: boolean = false
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const table = isStaff ? 'staff' : 'users';

    const result = await db.execute({
      sql: `SELECT id, email, password FROM ${table} WHERE email = ?`,
      args: [email.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid email or password' };
    }

    const user = result.rows[0] as any;

    if (!user.password) {
      return { success: false, error: 'Account requires password setup. Please use Google login or contact support.' };
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Check if email is verified (only for non-staff users)
    if (!isStaff) {
      const verificationResult = await db.execute({
        sql: `SELECT email_verified FROM users WHERE id = ?`,
        args: [user.id],
      });

      if (verificationResult.rows.length > 0) {
        const userRecord = verificationResult.rows[0] as any;
        if (!userRecord.email_verified) {
          return {
            success: false,
            error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
            needsVerification: true,
            email: email
          };
        }
      }
    }

    return { success: true, userId: user.id };
  } catch (error) {
    ;
    return { success: false, error: 'An error occurred during login' };
  }
}

// Create or update user password
export async function setUserPassword(
  userId: string,
  password: string,
  isStaff: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const table = isStaff ? 'staff' : 'users';
    const hashedPassword = await hashPassword(password);

    await db.execute({
      sql: `UPDATE ${table} SET password = ? WHERE id = ?`,
      args: [hashedPassword, userId],
    });

    return { success: true };
  } catch (error) {
    ;
    return { success: false, error: 'Failed to set password' };
  }
}

// Magic Link Flow
export async function createMagicLink(email: string, isStaff: boolean = false): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes

  await db.execute({
    sql: `INSERT INTO magic_links (id, email, token_hash, is_staff, expires_at) 
          VALUES (?, ?, ?, ?, ?)`,
    args: [nanoid(), email.toLowerCase(), tokenHash, isStaff ? 1 : 0, expiresAt],
  });

  const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  const path = isStaff ? '/admin/auth/verify' : '/auth/verify';
  return `${baseUrl}${path}?token=${token}`;
}

export async function sendMagicLinkEmail(email: string, isStaff: boolean = false): Promise<{ success: boolean; error?: string }> {
  try {
    const magicLink = await createMagicLink(email, isStaff);

    await resend.emails.send({
      from: 'Mendonca Global Gateway <no-reply@resend.mendoncagg.com>',
      to: email,
      subject: 'Your Login Link - Mendonca Global Gateway',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d;">Login to Mendonca Global Gateway</h1>
          <p>Click the button below to securely log in to your account. This link will expire in 15 minutes.</p>
          <a href="${magicLink}" style="display: inline-block; background-color: #ed8936; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            ${isStaff ? 'Login to Admin Dashboard' : 'Login to Your Dashboard'}
          </a>
          <p style="color: #666; font-size: 14px;">If you didn't request this link, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">Mendonca Global Gateway - Your trusted freight forwarding partner</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    ;
    return { success: false, error: 'Failed to send email' };
  }
}

export async function verifyMagicLink(token: string): Promise<{ success: boolean; email?: string; isStaff?: boolean; error?: string }> {
  const tokenHash = hashToken(token);

  const result = await db.execute({
    sql: `SELECT * FROM magic_links WHERE token_hash = ? AND used = 0 AND expires_at > ?`,
    args: [tokenHash, Math.floor(Date.now() / 1000)],
  });

  if (result.rows.length === 0) {
    return { success: false, error: 'Invalid or expired token' };
  }

  const magicLink = result.rows[0] as any;

  // Mark as used
  await db.execute({
    sql: `UPDATE magic_links SET used = 1 WHERE id = ?`,
    args: [magicLink.id],
  });

  return {
    success: true,
    email: magicLink.email,
    isStaff: magicLink.is_staff === 1
  };
}

// Email Verification
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

  await db.execute({
    sql: `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) 
          VALUES (?, ?, ?, ?)`,
    args: [nanoid(), userId, tokenHash, expiresAt],
  });

  return token;
}

export async function sendVerificationEmail(
  email: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await createEmailVerificationToken(userId);
    const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    const FROM_ADDRESS = import.meta.env.RESEND_FROM_EMAIL || 'Mendonca Global Gateway <no-reply@resend.mendoncagg.com>';
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    
    // As a senior developer practice: Log the URL in development for immediate access
    if (import.meta.env.DEV || import.meta.env.MODE === 'development' || baseUrl.includes('localhost')) {
      console.log('🔑 [Dev] Email Verification URL:', verificationUrl);
    }

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Verify Your Email - Mendonca Global Gateway',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d;">Verify Your Email Address</h1>
          <p>Thank you for creating an account with Mendonca Global Gateway. Please verify your email address to activate your account.</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #ed8936; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">Mendonca Global Gateway - Your trusted freight forwarding partner</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('🚨 Error sending verification email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

export async function verifyEmail(
  token: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const tokenHash = hashToken(token);

  const result = await db.execute({
    sql: `SELECT * FROM email_verification_tokens WHERE token_hash = ? AND expires_at > ?`,
    args: [tokenHash, Math.floor(Date.now() / 1000)],
  });

  if (result.rows.length === 0) {
    return { success: false, error: 'Invalid or expired verification token' };
  }

  const verificationToken = result.rows[0] as any;

  // Mark email as verified
  await db.execute({
    sql: `UPDATE users SET email_verified = 1 WHERE id = ?`,
    args: [verificationToken.user_id],
  });

  // Delete the verification token
  await db.execute({
    sql: `DELETE FROM email_verification_tokens WHERE id = ?`,
    args: [verificationToken.id],
  });

  return { success: true, userId: verificationToken.user_id };
}

// Session Management
export async function createSession(userId: string, isStaff: boolean = false): Promise<string> {
  const sessionId = nanoid();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const currentTime = Math.floor(Date.now() / 1000);
  const expiresAt = currentTime + (7 * 24 * 60 * 60); // 7 days

  const table = isStaff ? 'staff_sessions' : 'sessions';
  const idColumn = isStaff ? 'staff_id' : 'user_id';

  await db.execute({
    sql: `INSERT INTO ${table} (id, ${idColumn}, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
    args: [sessionId, userId, tokenHash, expiresAt],
  });

  if (!isStaff) {
    await db.execute({
      sql: 'UPDATE users SET last_activity = ? WHERE id = ?',
      args: [currentTime, userId],
    });
  }

  return token;
}

export async function validateSession(token: string, isStaff: boolean = false): Promise<{ valid: boolean; userId?: string }> {
  const tokenHash = hashToken(token);
  const table = isStaff ? 'staff_sessions' : 'sessions';
  const idColumn = isStaff ? 'staff_id' : 'user_id';

  const result = await db.execute({
    sql: `SELECT ${idColumn} FROM ${table} WHERE token_hash = ? AND expires_at > ?`,
    args: [tokenHash, Math.floor(Date.now() / 1000)],
  });

  if (result.rows.length === 0) {
    return { valid: false };
  }

  return { valid: true, userId: result.rows[0][idColumn] as string };
}

export async function deleteSession(token: string, isStaff: boolean = false): Promise<void> {
  const tokenHash = hashToken(token);
  const table = isStaff ? 'staff_sessions' : 'sessions';

  await db.execute({
    sql: `DELETE FROM ${table} WHERE token_hash = ?`,
    args: [tokenHash],
  });
}

// Cookie helpers for Astro
export function setSessionCookie(cookie: any, token: string, isStaff: boolean = false): void {
  cookie.set(isStaff ? 'admin_session' : 'session', token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function getSessionToken(cookie: any, isStaff: boolean = false): string | undefined {
  return cookie.get(isStaff ? 'admin_session' : 'session')?.value;
}

export function clearSessionCookie(cookie: any, isStaff: boolean = false): void {
  cookie.delete(isStaff ? 'admin_session' : 'session', { path: '/' });
}

// Signed invoice PDF links
// These helpers create and verify HMAC-based tokens so invoice PDFs
// can be viewed from email links without requiring a login.

export function createInvoiceFileLink(
  invoiceId: string | number,
  baseUrl: string,
  ttlSeconds: number = 7 * 24 * 60 * 60 // 7 days
): string {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const data = `invoice:${invoiceId}:${expires}`;
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');

  const url = new URL(`/api/invoices/${invoiceId}/file`, baseUrl);
  url.searchParams.set('token', signature);
  url.searchParams.set('expires', String(expires));

  return url.toString();
}

export function verifyInvoiceFileToken(
  invoiceId: string | number,
  token: string,
  expires: number
): boolean {
  // Expired tokens are invalid
  if (!expires || expires <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const data = `invoice:${invoiceId}:${expires}`;
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');

  return token === expected;
}
