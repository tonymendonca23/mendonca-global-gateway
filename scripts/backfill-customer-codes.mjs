#!/usr/bin/env node
// Backfill customer_code (e.g. MGG123456) for every user who doesn't have one.
//
// Why this exists: users who signed up via Google OAuth or magic link never
// got a customer_code generated (only the password signup flow does).
// The referral program uses customer_code as the referral code, so these
// customers need one to participate.
//
// Usage:
//   node scripts/backfill-customer-codes.mjs            # dry run (report only)
//   node scripts/backfill-customer-codes.mjs --apply    # write codes to the DB
//
// By default it reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from .env.
// To target a different database (e.g. production), pass them explicitly:
//   TURSO_DATABASE_URL=libsql://prod.turso.io TURSO_AUTH_TOKEN=xxx node scripts/backfill-customer-codes.mjs --apply

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@libsql/client';

const APPLY = process.argv.includes('--apply');

async function loadEnvFromFile() {
    const envPath = path.resolve(process.cwd(), '.env');
    try {
        const raw = await fs.readFile(envPath, 'utf8');
        for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) continue;
            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            // Explicit env vars (e.g. TURSO_DATABASE_URL=... node ...) win over .env
            if (!(key in process.env)) {
                process.env[key] = value;
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

// Same format & collision strategy as register.ts
async function generateUniqueCode(db, usedCodes) {
    for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = `MGG${Math.floor(100000 + Math.random() * 900000)}`;
        if (usedCodes.has(candidate)) continue;

        const codeCheck = await db.execute({
            sql: 'SELECT id FROM users WHERE customer_code = ?',
            args: [candidate],
        });

        if (codeCheck.rows.length === 0) {
            return candidate;
        }
    }
    throw new Error('Could not generate a unique customer code after 10 attempts');
}

async function main() {
    await loadEnvFromFile();

    const dbUrl = process.env.TURSO_DATABASE_URL;
    const dbToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl || !dbToken) {
        console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
        process.exit(1);
    }

    console.log(`Database: ${dbUrl.replace(/libsql:\/\/[^:]*:[^@]*@/, 'libsql://***:***@')}`);
    console.log(`Mode: ${APPLY ? 'APPLY (will write to the database)' : 'DRY RUN (no changes)'}\n`);

    const db = createClient({ url: dbUrl, authToken: dbToken });

    try {
        const missingResult = await db.execute({
            sql: `SELECT id, name, email FROM users
                  WHERE customer_code IS NULL OR customer_code = ''
                  ORDER BY created_at ASC`,
            args: [],
        });

        const users = missingResult.rows;

        if (users.length === 0) {
            console.log('✅ All users already have a customer_code. Nothing to do.');
            return;
        }

        console.log(`Found ${users.length} user(s) without a customer_code:\n`);

        // Track codes generated in this run so the batch itself has no dupes
        const usedCodes = new Set();
        let updated = 0;

        for (const user of users) {
            const code = await generateUniqueCode(db, usedCodes);
            usedCodes.add(code);

            console.log(`  ${(user.name || '(no name)').padEnd(30)} ${(user.email || '').padEnd(35)} → ${code}`);

            if (APPLY) {
                await db.execute({
                    sql: 'UPDATE users SET customer_code = ?, updated_at = unixepoch() WHERE id = ? AND (customer_code IS NULL OR customer_code = \'\')',
                    args: [code, user.id],
                });
                updated++;
            }
        }

        console.log('');
        if (APPLY) {
            console.log(`✅ Assigned customer codes to ${updated} user(s).`);

            // Verify no user is left without a code
            const remaining = await db.execute({
                sql: `SELECT COUNT(*) as c FROM users WHERE customer_code IS NULL OR customer_code = ''`,
                args: [],
            });
            console.log(`Users still missing a code: ${remaining.rows[0].c}`);
        } else {
            console.log(`DRY RUN complete — no changes were made.`);
            console.log(`Re-run with --apply to assign these ${users.length} code(s):`);
            console.log(`  node scripts/backfill-customer-codes.mjs --apply`);
        }
    } finally {
        await db.close?.();
    }
}

main().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
});
