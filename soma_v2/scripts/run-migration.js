require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const migrationFile = process.argv[2];
if (!migrationFile) { console.error('Usage: node scripts/run-migration.js <migration-file>'); process.exit(1); }

const sql = fs.readFileSync(path.resolve(migrationFile), 'utf8');
const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!dbUrl) { console.error('No POSTGRES_URL found in .env'); process.exit(1); }

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  await client.query(sql);
  console.log('Migration applied:', migrationFile);
  await client.end();
}

run().catch(e => { console.error('Failed:', e.message); client.end().catch(() => {}); process.exit(1); });
