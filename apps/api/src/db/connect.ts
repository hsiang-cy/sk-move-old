import 'dotenv/config'
import * as schema from './schema.js';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

if (!process.env.DB_URL) {
    throw new Error('DB_URL .env error');
}


const sql = neon(process.env.DB_URL);
const db = drizzle({ client: sql, schema });

export { db, sql };
