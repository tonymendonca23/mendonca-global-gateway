import type { APIRoute } from 'astro';
import db from '../../../../lib/db';
import { nanoid } from 'nanoid';

// Simple CSV parser for robust handling of basic string data
function parseCSV(csvString: string) {
    const lines = csvString.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return null;

    // Extremely basic split (assumes no commas inside quotes)
    // For a more robust parsing, consider installing csv-parse
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
            record[header] = values[index] ? values[index].trim() : '';
        });
        records.push(record);
    }
    return records;
}

export const POST: APIRoute = async ({ request, locals }) => {
    if (!locals.staff) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const { csv } = await request.json();
        if (!csv) {
            return new Response(JSON.stringify({ error: 'No CSV data provided' }), { status: 400 });
        }

        const records = parseCSV(csv);
        if (!records || records.length === 0) {
            return new Response(JSON.stringify({ error: 'Invalid or empty CSV format' }), { status: 400 });
        }

        let inserted = 0;

        for (const record of records) {
            if (!record.store_name || !record.description || !record.status) {
                // Skip incomplete records
                continue;
            }

            let customerId = record.customer_id;

            // Find user by email if ID not provided
            if (!customerId && record.customer_email) {
                const userEmail = record.customer_email.trim().toLowerCase();
                const userResult = await db.execute({
                    sql: `SELECT id FROM users WHERE email = ? LIMIT 1`,
                    args: [userEmail]
                });
                if (userResult.rows.length > 0) {
                    customerId = userResult.rows[0].id as string;
                } else {
                    // --- CREATE SHADOW ACCOUNT ---
                    // The customer hasn't signed up yet. We create an unverified profile.
                    // Registration API will naturally overwrite this profile when they finally sign up.
                    customerId = nanoid();

                    let newCustomerCode = '';
                    for (let attempt = 0; attempt < 10; attempt++) {
                        const candidate = `MGG${Math.floor(100000 + Math.random() * 900000)}`;
                        const codeCheck = await db.execute({
                            sql: 'SELECT id FROM users WHERE customer_code = ?',
                            args: [candidate],
                        });
                        if (codeCheck.rows.length === 0) {
                            newCustomerCode = candidate;
                            break;
                        }
                    }

                    // Use customer_name from CSV if available, else use email prefix
                    const customerName = record.customer_name || userEmail.split('@')[0];
                    const now = Math.floor(Date.now() / 1000);

                    await db.execute({
                        sql: `INSERT INTO users (id, email, name, customer_code, email_verified, created_at)
                              VALUES (?, ?, ?, ?, 0, ?)`,
                        args: [customerId, userEmail, customerName, newCustomerCode, now]
                    });
                }
            }

            if (!customerId) {
                // If we still don't have a user, create a dummy or skip
                continue;
            }

            // Format weights and generate defaults
            const weight = record.weight ? parseFloat(record.weight) : null;
            const mgg_tracking = record.mgg_tracking_number || `MGG-${nanoid(8).toUpperCase()}`;
            const original_tracking = record.original_tracking_number || null;
            const branch = record.branch || 'georgetown';

            const status = record.status.toLowerCase();
            // Valid mapping check
            const validStatuses = ['registered', 'at_warehouse', 'in_transit', 'customs', 'ready_for_pickup', 'delivered'];
            const finalStatus = validStatuses.includes(status) ? status : 'delivered';

            const pkgId = nanoid();

            // INSERT (bypassing email hook since it's raw DB access)
            await db.execute({
                sql: `
          INSERT INTO packages (
            id, customer_id, store_name, description, 
            status, mgg_tracking_number, original_tracking_number, 
            weight, branch, registered_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
        `,
                args: [
                    pkgId,
                    customerId,
                    record.store_name,
                    record.description,
                    finalStatus,
                    mgg_tracking,
                    original_tracking,
                    weight,
                    branch,
                    record.registered_at || null
                ]
            });

            inserted++;
        }

        return new Response(JSON.stringify({ success: true, inserted }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('CSV Import Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process import' }), { status: 500 });
    }
};