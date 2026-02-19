import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from './errorHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new ApiError(401, 'Not authorized, no token provided');

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) throw new ApiError(401, 'User not found');
    if (user.status !== 'ACTIVE') throw new ApiError(401, 'User account is not active');
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') throw new ApiError(401, 'Invalid token');
    if (error.name === 'TokenExpiredError') throw new ApiError(401, 'Token expired');
    throw error;
  }
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated');
  if (!roles.includes(req.user.role)) throw new ApiError(403, `Role ${req.user.role} is not authorized`);
  next();
};
