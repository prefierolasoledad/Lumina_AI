import express from 'express';
import { runToolkit } from '../controllers/toolkitController.js';
import { protect } from '../middleware/authMiddleware.js';
import { toolkitLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Authenticated + rate-limited AI tool generation
router.post('/generate', protect, toolkitLimiter, runToolkit);

export default router;
