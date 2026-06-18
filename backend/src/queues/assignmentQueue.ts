import { Queue } from 'bullmq';
import { bullMQRedisOptions } from '../config/redis.js';

const queueName = `assignment-generation-${process.env.NODE_ENV || 'development'}`;

// Each BullMQ Queue needs its own connection — pass options, not an ioredis instance
export const assignmentQueue = new Queue(queueName, {
  connection: bullMQRedisOptions,
  defaultJobOptions: {
    // The worker retries Gemini transient errors in-process (3 attempts with
    // backoff), so we do NOT add queue-level retries — one job run = 3 attempts,
    // then it fails cleanly with a high-demand warning.
    attempts: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

console.log('BullMQ assignment queue initialized');

