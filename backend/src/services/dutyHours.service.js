import Shift from '../models/Shift.js';
import DutyLog from '../models/DutyLog.js';
import Staff from '../models/Staff.js';
import logger from '../utils/logger.js';

export const calculateDutyHours = (signOnDateTime) => {
  const diffMs = new Date() - new Date(signOnDateTime);
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

export const getActiveShifts = async () => {
  return Shift.find({
    status: { $in: ['IN_PROGRESS', 'SCHEDULED', 'RELIEF_PLANNED'] },
    signOffDateTime: null,
  })
    .populate({ path: 'locoPilot', select: '_id employeeId name phone' })
    .populate({ path: 'trainManager', select: '_id employeeId name phone' })
    .populate({ path: 'locomotive', select: 'locomotiveNo' });
};

export const checkAlertThreshold = (dutyHours, shift) => {
  const alerts = [];
  if (dutyHours >= 7  && !shift.alert7HrSent)  alerts.push({ type: '7HR',  threshold: 7  });
  if (dutyHours >= 8  && !shift.alert8HrSent)  alerts.push({ type: '8HR',  threshold: 8  });
  if (dutyHours >= 9  && !shift.alert9HrSent)  alerts.push({ type: '9HR',  threshold: 9  });
  if (dutyHours >= 10 && !shift.alert10HrSent) alerts.push({ type: '10HR', threshold: 10 });
  if (dutyHours >= 11 && !shift.alert11HrSent) alerts.push({ type: '11HR', threshold: 11 });
  if (dutyHours >= 14 && !shift.alert14HrSent) alerts.push({ type: '14HR', threshold: 14 });
  return alerts;
};

export const markAlertAsSent = async (shiftId, alertType) => {
  const now = new Date();
  const fieldMap = {
    '7HR':  { alert7HrSent: true,  alert7HrSentAt: now  },
    '8HR':  { alert8HrSent: true,  alert8HrSentAt: now  },
    '9HR':  { alert9HrSent: true,  alert9HrSentAt: now  },
    '10HR': { alert10HrSent: true, alert10HrSentAt: now },
    '11HR': { alert11HrSent: true, alert11HrSentAt: now },
    '14HR': { alert14HrSent: true, alert14HrSentAt: now },
  };
  await Shift.findByIdAndUpdate(shiftId, fieldMap[alertType] || {});
};

export const createAlertLog = async (shift, alertType, dutyHours) => {
  const logTypeMap = {
    '7HR': 'ALERT_7HR', '8HR': 'ALERT_8HR', '9HR': 'ALERT_9HR',
    '10HR': 'ALERT_10HR', '11HR': 'ALERT_11HR', '14HR': 'ALERT_14HR',
  };
  const logType = logTypeMap[alertType];
  if (!logType) return;

  await DutyLog.insertMany([
    {
      shift: shift._id,
      staff: shift.locoPilot._id,
      logType,
      dutyHoursAtLog: dutyHours,
      remarks: `${alertType} duty hour alert triggered`,
      metadata: { trainNumber: shift.trainNumber, alertType, timestamp: new Date().toISOString() },
    },
    {
      shift: shift._id,
      staff: shift.trainManager._id,
      logType,
      dutyHoursAtLog: dutyHours,
      remarks: `${alertType} duty hour alert triggered`,
      metadata: { trainNumber: shift.trainNumber, alertType, timestamp: new Date().toISOString() },
    },
  ]);

  logger.info(`Duty log created for ${alertType} alert - Shift: ${shift._id}`);
};

export const recordAlertResponse = async (shiftId, alertType, response, remarks = null) => {
  const shift = await Shift.findById(shiftId).populate('locoPilot').populate('trainManager');
  if (!shift) throw new Error('Shift not found');

  const updateData = {};
  let logType = null;
  let statusUpdate = null;

  switch (alertType) {
    case '8HR':
      updateData.alert8HrResponse = response;
      if (response === 'PLAN_RELIEF') { updateData.reliefPlanned = true; updateData.reliefRequired = true; statusUpdate = 'RELIEF_PLANNED'; logType = 'RELIEF_PLANNED'; }
      else if (response === 'RELIEF_NOT_REQUIRED') { updateData.reliefRequired = false; logType = 'RELIEF_NOT_REQUIRED'; }
      break;
    case '9HR':
      updateData.alert9HrResponse = response;
      if (response === 'CREW_RELIEVED') { statusUpdate = 'COMPLETED'; logType = 'CREW_RELIEVED'; }
      else if (response === 'CREW_NOT_BOOKED') { logType = 'CREW_NOT_BOOKED'; }
      break;
    case '10HR':
      updateData.alert10HrResponse = response;
      if (response === 'RELIEF_ARRANGED') { updateData.reliefPlanned = true; statusUpdate = 'RELIEF_PLANNED'; logType = 'RELIEF_PLANNED'; }
      else if (response === 'CONTINUE_DUTY') { logType = 'KEEP_ON_DUTY'; }
      break;
    case '11HR':
      updateData.alert11HrResponse = response;
      if (response === 'KEEP_ON') { logType = 'KEEP_ON_DUTY'; }
      else if (response === 'CREW_ALREADY_RELIEVED') { statusUpdate = 'COMPLETED'; logType = 'CREW_ALREADY_RELIEVED'; }
      break;
    case '14HR':
      updateData.alert14HrResponse = response;
      if (response === 'EMERGENCY_RELIEF') { updateData.reliefRequired = true; updateData.reliefPlanned = true; statusUpdate = 'RELIEF_PLANNED'; logType = 'RELIEF_PLANNED'; }
      else if (response === 'SHIFT_ENDING') { logType = 'RELEASE'; }
      break;
  }

  if (statusUpdate) updateData.status = statusUpdate;

  const updatedShift = await Shift.findByIdAndUpdate(shiftId, updateData, { new: true })
    .populate('locoPilot').populate('trainManager');

  if (logType) {
    const dutyHours = calculateDutyHours(updatedShift.signOnDateTime);
    await DutyLog.insertMany([
      { shift: updatedShift._id, staff: updatedShift.locoPilot._id, logType, dutyHoursAtLog: dutyHours, remarks: remarks || `${alertType} response: ${response}`, metadata: { alertType, response, timestamp: new Date().toISOString() } },
      { shift: updatedShift._id, staff: updatedShift.trainManager._id, logType, dutyHoursAtLog: dutyHours, remarks: remarks || `${alertType} response: ${response}`, metadata: { alertType, response, timestamp: new Date().toISOString() } },
    ]);
  }

  if (statusUpdate === 'COMPLETED') {
    await Staff.updateMany(
      { _id: { $in: [updatedShift.locoPilot._id, updatedShift.trainManager._id] } },
      { status: 'AVAILABLE' }
    );
  }

  logger.info(`Alert response recorded: ${shiftId} — ${alertType} — ${response}`);
  return updatedShift;
};

export const completeShift = async (shiftId, signOffData) => {
  const { signOffDateTime, signOffStation } = signOffData;
  const shift = await Shift.findById(shiftId).populate('locoPilot').populate('trainManager');
  if (!shift) throw new Error('Shift not found');

  const dutyHours = calculateDutyHours(shift.signOnDateTime);

  const updatedShift = await Shift.findByIdAndUpdate(
    shiftId,
    { signOffDateTime: new Date(signOffDateTime), signOffStation, dutyHours, status: 'COMPLETED' },
    { new: true }
  ).populate('locoPilot').populate('trainManager');

  await DutyLog.insertMany([
    { shift: updatedShift._id, staff: updatedShift.locoPilot._id, logType: 'RELEASE', dutyHoursAtLog: dutyHours, remarks: 'Shift completed and crew released' },
    { shift: updatedShift._id, staff: updatedShift.trainManager._id, logType: 'RELEASE', dutyHoursAtLog: dutyHours, remarks: 'Shift completed and crew released' },
  ]);

  await Staff.updateMany(
    { _id: { $in: [updatedShift.locoPilot._id, updatedShift.trainManager._id] } },
    { status: 'AVAILABLE' }
  );

  logger.info(`Shift ${shiftId} completed with ${dutyHours} duty hours`);
  return updatedShift;
};
