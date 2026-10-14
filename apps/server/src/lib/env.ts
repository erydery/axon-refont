import path from 'node:path';
import dotenv from 'dotenv';

// The refont workspace stores secrets at its root; keep supporting the ERP-style
// app-local .env file as well. Existing process variables always take priority.
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

process.env.GROQ_API_KEY ??= process.env.NEXT_PUBLIC_GROQ_API_KEY;