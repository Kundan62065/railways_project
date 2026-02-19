import * as userService from '../services/user.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const users = await userService.getPendingRequests();
  res.status(200).json({ success: true, data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: user });
});

export const approveUser = asyncHandler(async (req, res) => {
  const user = await userService.approveUser(req.params.id, req.user.employeeId);
  const io = req.app.get('io');
  if (io) io.emit('user:approved', { userId: user._id, name: user.name });
  res.status(200).json({ success: true, message: 'User approved successfully', data: user });
});

export const rejectUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await userService.rejectUser(req.params.id, req.user.employeeId, reason);
  res.status(200).json({ success: true, message: 'User rejected', data: user });
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await userService.changeUserRole(req.params.id, role);
  res.status(200).json({ success: true, message: 'Role updated', data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'User updated', data: user });
});

export const activateUser = asyncHandler(async (req, res) => {
  const user = await userService.activateUser(req.params.id);
  res.status(200).json({ success: true, message: 'User activated', data: user });
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  res.status(200).json({ success: true, message: 'User deactivated', data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(200).json({ success: true, message: 'User deleted' });
});
