import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

let socket = null;

/**
 * Initialize socket connection with auth token
 */
export const initSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('⚠️ Socket connection error:', error.message);
  });

  return socket;
};

/**
 * Get existing socket instance
 */
export const getSocket = () => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a specific shift room for targeted updates
 */
export const joinShiftRoom = (shiftId) => {
  if (socket?.connected) {
    socket.emit('join:shift', shiftId);
  }
};

/**
 * Leave a shift room
 */
export const leaveShiftRoom = (shiftId) => {
  if (socket?.connected) {
    socket.emit('leave:shift', shiftId);
  }
};

/**
 * Subscribe to duty alerts
 * @param {Function} onAlert - callback(alertData)
 * @returns cleanup function
 */
export const subscribeToDutyAlerts = (onAlert) => {
  if (!socket) return () => {};

  socket.on('dutyAlert', onAlert);
  return () => socket.off('dutyAlert', onAlert);
};

/**
 * Subscribe to alert responses
 * @param {Function} onResponse - callback(responseData)
 * @returns cleanup function
 */
export const subscribeToAlertResponses = (onResponse) => {
  if (!socket) return () => {};

  socket.on('alertResponse', onResponse);
  return () => socket.off('alertResponse', onResponse);
};

/**
 * Subscribe to shift updates
 * @param {Function} onUpdate - callback(updateData)
 * @returns cleanup function
 */
export const subscribeToShiftUpdates = (onUpdate) => {
  if (!socket) return () => {};

  socket.on('shift:created', onUpdate);
  socket.on('shift:updated', onUpdate);
  socket.on('shiftCompleted', onUpdate);

  return () => {
    socket.off('shift:created', onUpdate);
    socket.off('shift:updated', onUpdate);
    socket.off('shiftCompleted', onUpdate);
  };
};

/**
 * Acknowledge a notification
 */
export const acknowledgeNotification = (notificationId, shiftId) => {
  if (socket?.connected) {
    socket.emit('notification:ack', { notificationId, shiftId });
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => socket?.connected || false;

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinShiftRoom,
  leaveShiftRoom,
  subscribeToDutyAlerts,
  subscribeToAlertResponses,
  subscribeToShiftUpdates,
  acknowledgeNotification,
  isSocketConnected,
};
