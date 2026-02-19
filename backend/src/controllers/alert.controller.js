import * as dutyHoursService from '../services/dutyHours.service.js';
import Shift from '../models/Shift.js';
import logger from '../utils/logger.js';

export const submitAlertResponse = async (req, res) => {
  try {
    const { id: shiftId } = req.params;
    const { alertType, response, remarks } = req.body;

    const validAlertTypes = ['8HR', '9HR', '10HR', '11HR', '14HR'];
    if (!validAlertTypes.includes(alertType)) {
      return res.status(400).json({ success: false, message: 'Invalid alert type' });
    }

    const validResponses = {
      '8HR':  ['PLAN_RELIEF', 'RELIEF_NOT_REQUIRED'],
      '9HR':  ['CREW_RELIEVED', 'CREW_NOT_BOOKED'],
      '10HR': ['RELIEF_ARRANGED', 'CONTINUE_DUTY'],
      '11HR': ['KEEP_ON', 'CREW_ALREADY_RELIEVED'],
      '14HR': ['EMERGENCY_RELIEF', 'SHIFT_ENDING'],
    };

    if (!validResponses[alertType].includes(response)) {
      return res.status(400).json({ success: false, message: `Invalid response for ${alertType}. Valid: ${validResponses[alertType].join(', ')}` });
    }

    const shift = await dutyHoursService.recordAlertResponse(shiftId, alertType, response, remarks);

    const io = req.app.get('io');
    if (io) {
      io.emit('alertResponse', { shiftId: shift._id, alertType, response, status: shift.status, timestamp: new Date() });
    }

    res.status(200).json({
      success: true,
      message: 'Alert response recorded successfully',
      data: { shiftId: shift._id, alertType, response, status: shift.status, reliefPlanned: shift.reliefPlanned, reliefRequired: shift.reliefRequired },
    });
  } catch (error) {
    logger.error('Submit alert response error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit alert response', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const getShiftAlertHistory = async (req, res) => {
  try {
    const { id: shiftId } = req.params;
    const shift = await Shift.findById(shiftId).select(
      'trainNumber signOnDateTime status alert7HrSent alert7HrSentAt alert8HrSent alert8HrSentAt alert8HrResponse alert9HrSent alert9HrSentAt alert9HrResponse alert10HrSent alert10HrSentAt alert10HrResponse alert11HrSent alert11HrSentAt alert11HrResponse alert14HrSent alert14HrSentAt alert14HrResponse'
    );

    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

    const alertHistory = [];
    if (shift.alert7HrSent)  alertHistory.push({ type: '7HR',  sentAt: shift.alert7HrSentAt,  response: null,                  requiresAction: false });
    if (shift.alert8HrSent)  alertHistory.push({ type: '8HR',  sentAt: shift.alert8HrSentAt,  response: shift.alert8HrResponse,  requiresAction: true });
    if (shift.alert9HrSent)  alertHistory.push({ type: '9HR',  sentAt: shift.alert9HrSentAt,  response: shift.alert9HrResponse,  requiresAction: true });
    if (shift.alert10HrSent) alertHistory.push({ type: '10HR', sentAt: shift.alert10HrSentAt, response: shift.alert10HrResponse, requiresAction: true });
    if (shift.alert11HrSent) alertHistory.push({ type: '11HR', sentAt: shift.alert11HrSentAt, response: shift.alert11HrResponse, requiresAction: true });
    if (shift.alert14HrSent) alertHistory.push({ type: '14HR', sentAt: shift.alert14HrSentAt, response: shift.alert14HrResponse, requiresAction: true });

    res.status(200).json({
      success: true,
      data: {
        shiftId: shift._id,
        trainNumber: shift.trainNumber,
        signOnDateTime: shift.signOnDateTime,
        currentDutyHours: dutyHoursService.calculateDutyHours(shift.signOnDateTime),
        status: shift.status,
        alertHistory,
      },
    });
  } catch (error) {
    logger.error('Get shift alert history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve alert history' });
  }
};

export const completeShiftController = async (req, res) => {
  try {
    const { id: shiftId } = req.params;
    const shift = await dutyHoursService.completeShift(shiftId, req.body);
    const io = req.app.get('io');
    if (io) io.emit('shiftCompleted', { shiftId: shift._id, trainNumber: shift.trainNumber, dutyHours: shift.dutyHours, timestamp: new Date() });

    res.status(200).json({ success: true, message: 'Shift completed successfully', data: { id: shift._id, trainNumber: shift.trainNumber, dutyHours: shift.dutyHours, status: shift.status, signOffDateTime: shift.signOffDateTime, signOffStation: shift.signOffStation } });
  } catch (error) {
    logger.error('Complete shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete shift' });
  }
};
