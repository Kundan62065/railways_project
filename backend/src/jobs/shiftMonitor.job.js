import * as dutyHoursService from '../services/dutyHours.service.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

const getAlertOptions = (alertType) => {
  const options = {
    '7HR':  { message: '7 Hour Alert: Duty nearing shift limit', requiresAction: false },
    '8HR':  { message: '8 Hour Alert: Plan relief or confirm continuation', requiresAction: true, options: [{ value: 'PLAN_RELIEF', label: 'Plan to get relief' }, { value: 'RELIEF_NOT_REQUIRED', label: 'Relief not required' }] },
    '9HR':  { message: '9 Hour Alert: Critical - Relief status required', requiresAction: true, options: [{ value: 'CREW_RELIEVED', label: 'Crew will be relieved' }, { value: 'CREW_NOT_BOOKED', label: 'Crew not booked' }] },
    '10HR': { message: '10 Hour Alert: Extended duty - Action required', requiresAction: true, options: [{ value: 'RELIEF_ARRANGED', label: 'Relief arranged' }, { value: 'CONTINUE_DUTY', label: 'Continue duty' }] },
    '11HR': { message: '11 Hour Alert: Critical - Immediate action required', requiresAction: true, options: [{ value: 'KEEP_ON', label: 'Keep on duty (emergency)' }, { value: 'CREW_ALREADY_RELIEVED', label: 'Crew already relieved' }] },
    '14HR': { message: '14 Hour Alert: MAXIMUM LIMIT REACHED - Emergency action required', requiresAction: true, options: [{ value: 'EMERGENCY_RELIEF', label: 'Emergency relief required' }, { value: 'SHIFT_ENDING', label: 'Shift ending now' }] },
  };
  return options[alertType] || { message: 'Unknown alert', requiresAction: false };
};

const sendAlert = async (io, shift, alert, dutyHours) => {
  const alertData = {
    shiftId: shift._id,
    trainNumber: shift.trainNumber,
    trainName: shift.trainName,
    locomotiveNo: shift.locomotive?.locomotiveNo,
    alertType: alert.type,
    dutyHours,
    locoPilot: { name: shift.locoPilot.name, employeeId: shift.locoPilot.employeeId, phone: shift.locoPilot.phone },
    trainManager: { name: shift.trainManager.name, employeeId: shift.trainManager.employeeId, phone: shift.trainManager.phone },
    signOnDateTime: shift.signOnDateTime,
    section: shift.section,
    timestamp: new Date(),
    options: getAlertOptions(alert.type),
  };

  io.emit('dutyAlert', alertData);
  io.to(`shift:${shift._id}`).emit('dutyAlert', alertData);
};

export const monitorShifts = async (io) => {
  try {
    logger.info('🔍 Running shift monitoring job...');
    const activeShifts = await dutyHoursService.getActiveShifts();

    if (activeShifts.length === 0) {
      logger.info('No active shifts to monitor');
      return;
    }

    logger.info(`Monitoring ${activeShifts.length} active shifts`);

    for (const shift of activeShifts) {
      try {
        const dutyHours = dutyHoursService.calculateDutyHours(shift.signOnDateTime);
        const alerts = dutyHoursService.checkAlertThreshold(dutyHours, shift);

        for (const alert of alerts) {
          await sendAlert(io, shift, alert, dutyHours);
          await dutyHoursService.markAlertAsSent(shift._id.toString(), alert.type);
          await dutyHoursService.createAlertLog(shift, alert.type, dutyHours);
          logger.info(`🚨 Alert sent: ${alert.type} for shift ${shift._id} (Train: ${shift.trainNumber}, Duty: ${dutyHours}h)`);
        }
      } catch (error) {
        logger.error(`Error monitoring shift ${shift._id}:`, error);
      }
    }

    logger.info('✅ Shift monitoring completed');
  } catch (error) {
    logger.error('Error in shift monitoring job:', error);
  }
};

export const startShiftMonitoring = (io) => {
  const intervalMs = config.monitoring.interval;
  logger.info(`🚀 Starting shift monitoring (every ${intervalMs / 60000} minutes)`);
  monitorShifts(io); // Run immediately
  return setInterval(() => monitorShifts(io), intervalMs);
};

export const stopShiftMonitoring = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    logger.info('⏹️ Shift monitoring stopped');
  }
};
