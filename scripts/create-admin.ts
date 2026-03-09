// Script to create admin account
// Run with: npx tsx scripts/create-admin.ts

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function createAdmin() {
    // Allow configuring the admin being created via environment variables
    // so you can easily create your own account and the owner's account.
    const email = process.env.ADMIN_EMAIL ?? 'ship@mendoncagg.com';
    const password = process.env.ADMIN_PASSWORD ?? 'shippingguy';
    const name = process.env.ADMIN_NAME ?? 'Miguel Mendonca';
    const role = process.env.ADMIN_ROLE ?? 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Check if admin already exists
        const existing = await db.execute({
            sql: 'SELECT id FROM staff WHERE email = ?',
            args: [email.toLowerCase()],
        });

        if (existing.rows.length > 0) {
            // Update existing admin/staff with new password and role/name if provided
            await db.execute({
                sql: 'UPDATE staff SET password = ?, name = ?, role = ? WHERE email = ?',
                args: [hashedPassword, name, role, email.toLowerCase()],
            });
            console.log('✅ Staff/admin password (and details) updated successfully!');
        } else {
            // Create new staff/admin
            await db.execute({
                sql: `INSERT INTO staff (id, email, name, role, password, created_at) 
              VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                    'admin-' + Date.now(),
                    email.toLowerCase(),
                    name,
                    role,
                    hashedPassword,
                    Math.floor(Date.now() / 1000)
                ],
            });
            console.log('✅ Staff/admin account created successfully!');
        }

        console.log('Email:', email);
        console.log('Role:', role);
        console.log('Name:', name);
        console.log('You can now log in with your password at /admin/login.');
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }

    process.exit(0);
}

createAdmin();
