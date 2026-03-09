import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import { generateWarehouseAddress } from '../src/lib/warehouse';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function updateAddresses() {
    console.log('Fetching all users...');
    const result = await db.execute('SELECT id, name, customer_code FROM users');
    const users = result.rows;

    console.log(`Found ${users.length} users. Updating addresses...`);

    let updatedCount = 0;
    for (const user of users) {
        if (!user.id || !user.name) continue;

        const newAddress = generateWarehouseAddress(user.name as string, user.customer_code as string | null);
        
        await db.execute({
            sql: 'UPDATE users SET us_warehouse_address = ? WHERE id = ?',
            args: [newAddress, user.id]
        });
        
        updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} user addresses!`);
    process.exit(0);
}

updateAddresses().catch(err => {
    console.error(err);
    process.exit(1);
});
