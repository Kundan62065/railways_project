import User from '../models/User.js';
import Shift from '../models/Shift.js';
import bcrypt from 'bcryptjs';
import config from '../config/config.js';

export const getAllUsers = async (filters = {}) => {
  const { status, role, isVerified, page = 1, limit = 10 } = filters;
  const query = {};
  if (status) query.status = status;
  if (role) query.role = role;
  if (isVerified !== undefined) query.isVerified = isVerified === 'true';

  const skip = (page - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  return { users, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), totalItems: total, itemsPerPage: parseInt(limit) } };
};

export const getPendingRequests = async () =>
  User.find({ isVerified: false, rejectedAt: null }).select('-password').sort({ createdAt: 1 });

export const getUserById = async (id) => User.findById(id).select('-password');

export const approveUser = async (userId, approvedByEmployeeId) =>
  User.findByIdAndUpdate(userId, {
    isVerified: true, verifiedAt: new Date(), verifiedBy: approvedByEmployeeId,
    status: 'ACTIVE', rejectedAt: null, rejectedBy: null, rejectionReason: null,
  }, { new: true }).select('-password');

export const rejectUser = async (userId, rejectedByEmployeeId, reason) =>
  User.findByIdAndUpdate(userId, {
    isVerified: false, rejectedAt: new Date(), rejectedBy: rejectedByEmployeeId,
    rejectionReason: reason || 'Application rejected by administrator', status: 'INACTIVE',
  }, { new: true }).select('-password');

export const changeUserRole = async (userId, newRole) =>
  User.findByIdAndUpdate(userId, { role: newRole }, { new: true }).select('-password');

export const updateUser = async (userId, updateData) => {
  const { password, ...otherData } = updateData;
  const data = { ...otherData };
  if (password) {
    data.password = await bcrypt.hash(password, config.security.bcryptRounds);
  }
  return User.findByIdAndUpdate(userId, data, { new: true }).select('-password');
};

export const activateUser = async (userId) =>
  User.findByIdAndUpdate(userId, { status: 'ACTIVE' }, { new: true }).select('-password');

export const deactivateUser = async (userId) =>
  User.findByIdAndUpdate(userId, { status: 'INACTIVE' }, { new: true }).select('-password');

export const deleteUser = async (userId) => {
  const count = await Shift.countDocuments({ $or: [{ createdBy: userId }, { updatedBy: userId }] });
  if (count > 0) throw new Error('Cannot delete user with associated shifts. Deactivate instead.');
  await User.findByIdAndDelete(userId);
  return true;
};
