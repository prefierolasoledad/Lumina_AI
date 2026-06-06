import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const assignmentQueue = new Queue('assignment-generation', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

console.log('BullMQ assignment queue initialized');
