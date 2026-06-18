import express from 'express';
import dns from 'dns';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

// Force IPv4 preference for DNS resolution to avoid ENETUNREACH IPv6 errors in cloud hosting environments (like Railway)
dns.setDefaultResultOrder('ipv4first');
import connectDB from './config/db.js';
import { validateEnv } from './config/validateEnv.js';
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import toolkitRoutes from './routes/toolkitRoutes.js';
import { initWebSocketServer } from './config/websocket.js';
import { startAssignmentWorker } from './workers/assignmentWorker.js';
import { redisConnection } from './config/redis.js';
import { verifySMTP } from './config/sendEmail.js';

// Load environment variables
dotenv.config();

// Fail fast if critical configuration is missing or insecure
validateEnv();

// Connect to MongoDB
connectDB();

// Verify SMTP connection on startup
verifySMTP();

const app = express();

// Trust reverse proxy (Railway, Render, Vercel etc.) for express-rate-limit
app.set('trust proxy', 1);

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server attached to the HTTP server
initWebSocketServer(server);

// Start BullMQ worker
startAssignmentWorker();

// Security headers (HSTS, nosniff, frameguard, etc.). This is a JSON API consumed
// cross-origin via the Next.js proxy, so disable the HTML-oriented CSP/COEP defaults
// that would otherwise need per-asset tuning and provide little value for JSON.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/toolkit', toolkitRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Lumina AI Backend API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Avoid leaking internal error details to clients in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';
  res.status(500).json({ success: false, message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
