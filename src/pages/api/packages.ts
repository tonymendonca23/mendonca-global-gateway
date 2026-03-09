import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { generateId, generateTrackingNumber } from '../../lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
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
    const data = await request.json();
    const { store_name, original_tracking_number, description, value_usd } = data;

    if (!store_name || !original_tracking_number) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Store name and tracking number are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate tracking
    const existing = await db.execute({
      sql: 'SELECT id FROM packages WHERE original_tracking_number = ? AND customer_id = ?',
      args: [original_tracking_number.trim(), user.id],
    });

    if (existing.rows.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This tracking number is already registered'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate tracking number (ensure unique)
    let mggTrackingNumber = generateTrackingNumber();
    let attempts = 0;
    while (attempts < 10) {
      const check = await db.execute({
        sql: 'SELECT id FROM packages WHERE mgg_tracking_number = ?',
        args: [mggTrackingNumber],
      });
      if (check.rows.length === 0) break;
      mggTrackingNumber = generateTrackingNumber();
      attempts++;
    }

    const id = generateId();
    const now = Math.floor(Date.now() / 1000);

    await db.execute({
      sql: `INSERT INTO packages (
              id, mgg_tracking_number, original_tracking_number, customer_id,
              store_name, description, value_usd, status, registered_at, status_updated_at, branch
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        mggTrackingNumber,
        original_tracking_number.trim(),
        user.id,
        store_name,
        description || null,
        value_usd || null,
        'registered',
        now,
        now,
        user.branch_preference || 'georgetown',
      ],
    });

    return new Response(JSON.stringify({
      success: true,
      tracking_number: mggTrackingNumber,
      package_id: id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    ;
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to register package'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ locals, url }) => {
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

  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let sql = `SELECT 
              id, mgg_tracking_number, original_tracking_number, store_name, 
              description, weight_lbs, value_usd, status, registered_at, 
              received_at, status_updated_at, branch
            FROM packages 
            WHERE customer_id = ?`;

  const args: any[] = [user.id];

  if (status) {
    sql += ` AND status = ?`;
    args.push(status);
  }

  sql += ` ORDER BY status_updated_at DESC LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const result = await db.execute({ sql, args });

  return new Response(JSON.stringify({
    success: true,
    packages: result.rows
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
