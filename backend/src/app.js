import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

import config from './config/config.js';
import logger from './utils/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { initializeSocket } from './socket/index.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import shiftRoutes from './routes/shift.routes.js';
import userRoutes from './routes/user.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO
let io = null;
if (config.features.socketEnabled) {
  io = new Server(httpServer, {
    cors: { origin: config.socket.corsOrigin, credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  initializeSocket(io);
  app.set('io', io);
  logger.info('✅ Socket.IO initialized');
}

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(config.cors));
app.use(compression());
app.use(config.env === 'development' ? morgan('dev') : morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// API Routes
const API_PREFIX = `/api/${config.apiVersion}`;

app.get(API_PREFIX, (req, res) => {
  res.status(200).json({ success: true, message: 'Railway Shift Management API (MERN)', version: config.apiVersion });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/shifts`, shiftRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export { app, httpServer, io };
