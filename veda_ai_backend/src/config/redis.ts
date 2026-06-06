import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// IORedis connection (used by BullMQ)
export const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
});

redisConnection.on('connect', () => console.log('Redis (BullMQ) connected'));
redisConnection.on('error', (err) => console.error('Redis error:', err));
