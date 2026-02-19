import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const connectedUsers = new Map();

export const initializeSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: No token provided'));
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`✅ Socket connected: ${socket.id} | User: ${socket.userId}`);
    connectedUsers.set(socket.userId, socket.id);

    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.userRole}`);
    socket.emit('connected', { message: 'Connected to Railway Shift Management System', socketId: socket.id });

    socket.on('join:shift', (shiftId) => {
      socket.join(`shift:${shiftId}`);
      socket.emit('joined:shift', { shiftId });
    });

    socket.on('leave:shift', (shiftId) => {
      socket.leave(`shift:${shiftId}`);
    });

    socket.on('subscribe:staff', (staffId) => socket.join(`staff:${staffId}`));
    socket.on('unsubscribe:staff', (staffId) => socket.leave(`staff:${staffId}`));

    socket.on('notification:ack', (data) => {
      io.to(`shift:${data.shiftId}`).emit('notification:acknowledged', {
        notificationId: data.notificationId,
        acknowledgedBy: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));

    socket.on('disconnect', (reason) => {
      logger.info(`❌ Socket disconnected: ${socket.id} | Reason: ${reason}`);
      connectedUsers.delete(socket.userId);
    });

    socket.on('error', (error) => logger.error(`Socket error for ${socket.id}:`, error));
  });

  return io;
};

export const emitToUser  = (io, userId,  event, data) => io.to(`user:${userId}`).emit(event, data);
export const emitToShift = (io, shiftId, event, data) => io.to(`shift:${shiftId}`).emit(event, data);
export const emitToRole  = (io, role,    event, data) => io.to(`role:${role}`).emit(event, data);
export const broadcastToAll = (io, event, data) => io.emit(event, data);

export { connectedUsers };
