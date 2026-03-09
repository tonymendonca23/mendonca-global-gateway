#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@libsql/client';

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

function prepareStatements(sql) {
    const withoutComments = sql
        .split(/\r?\n/)
        .map((line) => {
            const trimmed = line.trimStart();
            if (trimmed.startsWith('--')) {
                return '';
            }
            return line;
        })
        .join('\n');

    return withoutComments
        .split(';')
        .map((stmt) => stmt.trim())
        .filter(Boolean);
}

async function main() {
    const [, , fileArg] = process.argv;
    if (!fileArg) {
        console.error('Usage: npm run migrate <path-to-sql-file>');
        process.exit(1);
    }

    await loadEnvFromFile();

    const dbUrl = process.env.TURSO_DATABASE_URL;
    const dbToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl || !dbToken) {
        console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
        process.exit(1);
    }

    const migrationPath = path.resolve(process.cwd(), fileArg);
    const sql = await fs.readFile(migrationPath, 'utf8');
    const statements = prepareStatements(sql);

    if (statements.length === 0) {
        console.log(`No executable SQL statements found in ${migrationPath}`);
        return;
    }

    const client = createClient({ url: dbUrl, authToken: dbToken });

    try {
        for (const statement of statements) {
            await client.execute(statement);
            console.log(`Executed: ${statement.slice(0, 60)}${statement.length > 60 ? '…' : ''}`);
        }
        console.log('Migration completed successfully.');
    } finally {
        await client.close?.();
    }
}

main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
