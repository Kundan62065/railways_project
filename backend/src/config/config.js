import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8000,
  apiVersion: process.env.API_VERSION || 'v1',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/railway_db',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },

  cors: {
    origin: (origin, callback) => {
      const allowed = [
        'https://railway-project-frontend.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
      ];
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error('CORS blocked'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  },

  socket: {
    corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
  },

  features: {
    monitoringEnabled: process.env.MONITORING_ENABLED === 'true',
    socketEnabled: process.env.SOCKET_ENABLED === 'true',
    seedOnStartup: process.env.SEED_ON_STARTUP === 'true',
  },

  monitoring: {
    interval: parseInt(process.env.MONITORING_INTERVAL, 10) || 5 * 60 * 1000,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
