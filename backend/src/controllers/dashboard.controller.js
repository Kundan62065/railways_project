import Shift from '../models/Shift.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import DutyLog from '../models/DutyLog.js';
import { calculateDutyHours } from '../services/dutyHours.service.js';
import logger from '../utils/logger.js';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalShifts, activeShifts, completedShifts, scheduledShifts, reliefPlanned, cancelled,
      todayShifts, todayCompleted, todayActive,
      weekShifts, weekCompleted,
      monthShifts, monthCompleted,
      totalStaff, availableStaff, onDutyStaff,
    ] = await Promise.all([
      Shift.countDocuments(),
      Shift.countDocuments({ status: 'IN_PROGRESS' }),
      Shift.countDocuments({ status: 'COMPLETED' }),
      Shift.countDocuments({ status: 'SCHEDULED' }),
      Shift.countDocuments({ status: 'RELIEF_PLANNED' }),
      Shift.countDocuments({ status: 'CANCELLED' }),
      Shift.countDocuments({ createdAt: { $gte: today } }),
      Shift.countDocuments({ status: 'COMPLETED', signOffDateTime: { $gte: today } }),
      Shift.countDocuments({ status: 'IN_PROGRESS', signOnDateTime: { $gte: today } }),
      Shift.countDocuments({ createdAt: { $gte: weekStart } }),
      Shift.countDocuments({ status: 'COMPLETED', signOffDateTime: { $gte: weekStart } }),
      Shift.countDocuments({ createdAt: { $gte: monthStart } }),
      Shift.countDocuments({ status: 'COMPLETED', signOffDateTime: { $gte: monthStart } }),
      Staff.countDocuments(),
      Staff.countDocuments({ status: 'AVAILABLE' }),
      Staff.countDocuments({ status: 'ON_DUTY' }),
    ]);

    // Alert stats
    const alertShifts = await Shift.find({ status: { $in: ['IN_PROGRESS', 'RELIEF_PLANNED'] } })
      .select('alert7HrSent alert8HrSent alert9HrSent alert10HrSent alert11HrSent alert14HrSent');

    const alertCounts = {
      alert7Hr:    alertShifts.filter(s => s.alert7HrSent).length,
      alert8Hr:    alertShifts.filter(s => s.alert8HrSent).length,
      alert9Hr:    alertShifts.filter(s => s.alert9HrSent).length,
      alert10Hr:   alertShifts.filter(s => s.alert10HrSent).length,
      alert11Hr:   alertShifts.filter(s => s.alert11HrSent).length,
      alert14Hr:   alertShifts.filter(s => s.alert14HrSent).length,
      totalAlerts: alertShifts.reduce((sum, s) =>
        sum + [s.alert7HrSent, s.alert8HrSent, s.alert9HrSent, s.alert10HrSent, s.alert11HrSent, s.alert14HrSent].filter(Boolean).length, 0),
    };

    // Duty hours stats
    const completedWithHours = await Shift.find({ status: 'COMPLETED', dutyHours: { $ne: null } }).select('dutyHours');
    const totalHours = completedWithHours.reduce((s, sh) => s + (sh.dutyHours || 0), 0);
    const dutyHoursStats = {
      totalShifts:   completedWithHours.length,
      totalHours:    parseFloat(totalHours.toFixed(2)),
      averageHours:  completedWithHours.length ? parseFloat((totalHours / completedWithHours.length).toFixed(2)) : 0,
      maxHours:      completedWithHours.length ? parseFloat(Math.max(...completedWithHours.map(s => s.dutyHours || 0)).toFixed(2)) : 0,
    };

    // Active shifts with duty hours
    const currentActive = await Shift.find({ status: { $in: ['IN_PROGRESS', 'RELIEF_PLANNED'] }, signOffDateTime: null }).select('trainNumber signOnDateTime status');
    const activeShiftsDetails = currentActive.map(s => ({ id: s._id, trainNumber: s.trainNumber, status: s.status, currentDutyHours: parseFloat(calculateDutyHours(s.signOnDateTime).toFixed(2)) }));

    // User stats (admin only)
    let userStats = null;
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN') {
      const [total, active, pending] = await Promise.all([User.countDocuments(), User.countDocuments({ status: 'ACTIVE' }), User.countDocuments({ isVerified: false })]);
      userStats = { total, active, pendingApproval: pending };
    }

    // Top sections
    const sectionAgg = await Shift.aggregate([{ $group: { _id: '$section', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]);
    const dutyTypeAgg = await Shift.aggregate([{ $group: { _id: '$dutyType', count: { $sum: 1 } } }]);

    const stats = {
      overview: { totalShifts, activeShifts, completedShifts, scheduledShifts, reliefPlannedShifts: reliefPlanned, cancelledShifts: cancelled },
      today: { shiftsCreated: todayShifts, shiftsCompleted: todayCompleted, activeShifts: todayActive },
      thisWeek: { shiftsCreated: weekShifts, shiftsCompleted: weekCompleted },
      thisMonth: { shiftsCreated: monthShifts, shiftsCompleted: monthCompleted },
      alerts: alertCounts,
      dutyHours: dutyHoursStats,
      activeShiftsDetails,
      staff: { total: totalStaff, available: availableStaff, onDuty: onDutyStaff, unavailable: totalStaff - availableStaff - onDutyStaff },
      topSections: sectionAgg.map(s => ({ section: s._id, count: s.count })),
      dutyTypeDistribution: dutyTypeAgg.map(s => ({ dutyType: s._id, count: s.count })),
      ...(userStats && { users: userStats }),
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics' });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20, offset = 0, type } = req.query;
    const query = {};
    if (type) query.logType = type;

    const [activities, total] = await Promise.all([
      DutyLog.find(query)
        .populate({ path: 'shift', select: 'trainNumber trainName status section' })
        .populate({ path: 'staff', select: 'name employeeId' })
        .sort({ logTime: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit)),
      DutyLog.countDocuments(query),
    ]);

    const formatted = activities.map(a => ({
      id: a._id,
      type: a.logType,
      timestamp: a.logTime,
      dutyHours: a.dutyHoursAtLog,
      remarks: a.remarks,
      shift: a.shift ? { id: a.shift._id, trainNumber: a.shift.trainNumber, trainName: a.shift.trainName, status: a.shift.status, section: a.shift.section } : null,
      staff: a.staff ? { name: a.staff.name, employeeId: a.staff.employeeId } : null,
      metadata: a.metadata,
    }));

    res.status(200).json({ success: true, data: { activities: formatted, pagination: { total, limit: parseInt(limit), offset: parseInt(offset), hasMore: parseInt(offset) + parseInt(limit) < total } } });
  } catch (error) {
    logger.error('Get recent activities error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve recent activities' });
  }
};

export const getAlertsSummary = async (req, res) => {
  try {
    const activeShifts = await Shift.find({ status: { $in: ['IN_PROGRESS', 'RELIEF_PLANNED'] }, signOffDateTime: null })
      .populate({ path: 'locoPilot', select: 'name employeeId phone' })
      .populate({ path: 'trainManager', select: 'name employeeId phone' })
      .select('trainNumber trainName section status signOnDateTime alert7HrSent alert7HrSentAt alert8HrSent alert8HrSentAt alert8HrResponse alert9HrSent alert9HrSentAt alert9HrResponse alert10HrSent alert10HrSentAt alert10HrResponse alert11HrSent alert11HrSentAt alert11HrResponse alert14HrSent alert14HrSentAt alert14HrResponse')
      .sort({ signOnDateTime: 1 });

    const activeAlerts = activeShifts.map(shift => {
      const alerts = [];
      const dh = calculateDutyHours(shift.signOnDateTime);
      if (shift.alert7HrSent)  alerts.push({ type: '7HR',  sentAt: shift.alert7HrSentAt,  response: null,                   requiresAction: false });
      if (shift.alert8HrSent)  alerts.push({ type: '8HR',  sentAt: shift.alert8HrSentAt,  response: shift.alert8HrResponse,  requiresAction: !shift.alert8HrResponse });
      if (shift.alert9HrSent)  alerts.push({ type: '9HR',  sentAt: shift.alert9HrSentAt,  response: shift.alert9HrResponse,  requiresAction: !shift.alert9HrResponse });
      if (shift.alert10HrSent) alerts.push({ type: '10HR', sentAt: shift.alert10HrSentAt, response: shift.alert10HrResponse, requiresAction: !shift.alert10HrResponse });
      if (shift.alert11HrSent) alerts.push({ type: '11HR', sentAt: shift.alert11HrSentAt, response: shift.alert11HrResponse, requiresAction: !shift.alert11HrResponse });
      if (shift.alert14HrSent) alerts.push({ type: '14HR', sentAt: shift.alert14HrSentAt, response: shift.alert14HrResponse, requiresAction: !shift.alert14HrResponse });
      return { shift: { id: shift._id, trainNumber: shift.trainNumber, trainName: shift.trainName, section: shift.section, status: shift.status, currentDutyHours: parseFloat(dh.toFixed(2)), signOnDateTime: shift.signOnDateTime }, crew: { locoPilot: shift.locoPilot, trainManager: shift.trainManager }, alerts, pendingResponses: alerts.filter(a => a.requiresAction).length };
    }).filter(i => i.alerts.length > 0);

    const summary = {
      totalActiveShifts: activeShifts.length,
      shiftsWithAlerts: activeAlerts.length,
      totalActiveAlerts: activeAlerts.reduce((s, i) => s + i.alerts.length, 0),
      pendingResponses: activeAlerts.reduce((s, i) => s + i.pendingResponses, 0),
      criticalShifts: activeAlerts.filter(i => i.shift.currentDutyHours >= 11 || i.alerts.some(a => ['11HR', '14HR'].includes(a.type))).length,
    };

    res.status(200).json({ success: true, data: { summary, activeAlerts } });
  } catch (error) {
    logger.error('Get alerts summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve alerts summary' });
  }
};
