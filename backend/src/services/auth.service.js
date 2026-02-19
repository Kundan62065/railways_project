import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );
    return { accessToken, refreshToken };
  }

  async register(userData) {
    const { employeeId, name, email, phone, password, division, designation, role } = userData;

    const existing = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) {
      if (existing.email === email) throw new ApiError(400, 'Email already registered');
      if (existing.employeeId === employeeId) throw new ApiError(400, 'Employee ID already exists');
    }

    const requestedRole = role && ['USER', 'ADMIN', 'SUPERADMIN'].includes(role) ? role : 'USER';
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

    const user = await User.create({
      employeeId, name, email, phone, password: hashedPassword,
      division, designation, role: requestedRole,
      status: 'INACTIVE', isVerified: false,
    });

    logger.info(`New user registered: ${user.email} (pending approval)`);
    return { user };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid email or password');
    if (!user.isVerified) throw new ApiError(403, 'Your account is pending approval by administrator');
    if (user.status !== 'ACTIVE') throw new ApiError(403, 'Your account has been suspended or deactivated');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new ApiError(401, 'Invalid email or password');

    const tokens = this.generateTokens(user);
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    logger.info(`User logged in: ${user.email}`);

    const userObj = user.toJSON();
    return { user: userObj, ...tokens };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'Invalid refresh token');
      return this.generateTokens(user);
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}

export default new AuthService();
export { ApiError };
