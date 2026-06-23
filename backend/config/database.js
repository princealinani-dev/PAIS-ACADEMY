import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

export const query = (text, params) => pool.query(text, params);
export default pool;
