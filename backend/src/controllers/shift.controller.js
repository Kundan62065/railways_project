import { asyncHandler } from '../middleware/errorHandler.js';
import shiftService from '../services/shift.service.js';

export const createShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.createShift(req.body, req.user._id);
  const io = req.app.get('io');
  if (io) {
    io.emit('shift:created', { shiftId: shift._id, trainNumber: shift.trainNumber, locoPilot: shift.locoPilot?.name, trainManager: shift.trainManager?.name });
  }
  res.status(201).json({ success: true, message: 'Shift created successfully', data: shift });
});

export const getShiftById = asyncHandler(async (req, res) => {
  const shift = await shiftService.getShiftById(req.params.id);
  res.status(200).json({ success: true, data: shift });
});

export const listShifts = asyncHandler(async (req, res) => {
  const { status, trainNumber, locoPilotId, trainManagerId, startDate, endDate } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await shiftService.listShifts({ status, trainNumber, locoPilotId, trainManagerId, startDate, endDate }, page, limit);
  res.status(200).json({ success: true, data: result.shifts, pagination: result.pagination });
});

export const updateShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.updateShift(req.params.id, req.body, req.user._id);
  const io = req.app.get('io');
  if (io) {
    io.to(`shift:${req.params.id}`).emit('shift:updated', { shiftId: shift._id, status: shift.status, dutyHours: shift.dutyHours });
  }
  res.status(200).json({ success: true, message: 'Shift updated successfully', data: shift });
});

export const deleteShift = asyncHandler(async (req, res) => {
  await shiftService.deleteShift(req.params.id);
  res.status(200).json({ success: true, message: 'Shift deleted successfully' });
});

export const getActiveShiftsSummary = asyncHandler(async (req, res) => {
  const summary = await shiftService.getActiveShiftsSummary();
  res.status(200).json({ success: true, data: summary });
});
