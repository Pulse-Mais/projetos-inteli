import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
});

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment variables');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
});