import serverless from 'serverless-http';
import app from '../../src/server/app';
import { initDB } from '../../src/server/db';

// Initialize DB on cold start
initDB().catch(console.error);

export const handler = serverless(app);
