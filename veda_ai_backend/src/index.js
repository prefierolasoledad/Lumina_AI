import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import { initWebSocketServer } from './config/websocket.js';
import { startAssignmentWorker } from './workers/assignmentWorker.js';
import { redisConnection } from './config/redis.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize WebSocket server
initWebSocketServer();

// Start BullMQ worker
startAssignmentWorker();

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Veda AI Backend API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
