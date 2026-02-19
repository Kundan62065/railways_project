import authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, message: 'Registration successful. Pending approval.', data: result });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json({ success: true, message: 'Login successful', data: result });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  res.status(200).json({ success: true, message: 'Token refreshed successfully', data: tokens });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  res.status(200).json({ success: true, data: user });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logout successful' });
});
