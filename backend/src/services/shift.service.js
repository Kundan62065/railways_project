import Shift from '../models/Shift.js';
import Staff from '../models/Staff.js';
import Locomotive from '../models/Locomotive.js';
import DutyLog from '../models/DutyLog.js';
import logger from '../utils/logger.js';
import { ApiError } from './auth.service.js';

class ShiftService {
  async findOrCreateLocomotive(locomotiveNo) {
    let loco = await Locomotive.findOne({ locomotiveNo });
    if (!loco) {
      loco = await Locomotive.create({ locomotiveNo, autoCreated: true });
      logger.info(`✅ Locomotive created: ${locomotiveNo}`);
    }
    return loco;
  }

  async findOrCreateStaff(employeeId, name, staffType, phone = null) {
    let staff = await Staff.findOne({ employeeId });
    if (!staff) {
      staff = await Staff.create({ employeeId, name, staffType, phone, autoCreated: true });
      logger.info(`✅ Staff created: ${name} (${employeeId})`);
    } else {
      const updates = {};
      if (staff.name !== name) updates.name = name;
      if (phone && staff.phone !== phone) updates.phone = phone;
      if (Object.keys(updates).length > 0) {
        staff = await Staff.findByIdAndUpdate(staff._id, updates, { new: true });
      }
    }
    return staff;
  }

  calculateDutyHours(signOnTime, currentTime = new Date()) {
    const diffMs = new Date(currentTime) - new Date(signOnTime);
    return Math.max(0, diffMs / (1000 * 60 * 60));
  }

  async createShift(data, userId) {
    const locomotive = await this.findOrCreateLocomotive(data.locomotiveNo);
    const locoPilot = await this.findOrCreateStaff(data.locoPilot.employeeId, data.locoPilot.name, 'LOCO_PILOT', data.locoPilot.phone);
    const trainManager = await this.findOrCreateStaff(data.trainManager.employeeId, data.trainManager.name, 'TRAIN_MANAGER', data.trainManager.phone);

    // Check if staff already on duty
    const activeShifts = await Shift.find({
      $or: [{ locoPilot: locoPilot._id }, { trainManager: trainManager._id }],
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      signOffDateTime: null,
    });

    if (activeShifts.length > 0) {
      const busyStaff = [];
      activeShifts.forEach((s) => {
        if (s.locoPilot.toString() === locoPilot._id.toString()) busyStaff.push(`Loco Pilot ${locoPilot.name}`);
        if (s.trainManager.toString() === trainManager._id.toString()) busyStaff.push(`Train Manager ${trainManager.name}`);
      });
      throw new ApiError(400, `Staff already on duty: ${[...new Set(busyStaff)].join(', ')}`);
    }

    const dutyHours = this.calculateDutyHours(data.signOnDateTime);

    const shift = await Shift.create({
      trainNumber: data.trainNumber,
      trainName: data.trainName,
      locomotive: locomotive._id,
      locomotiveNo: locomotive.locomotiveNo,
      locoPilot: locoPilot._id,
      trainManager: trainManager._id,
      trainArrivalDateTime: new Date(data.trainArrivalDateTime),
      signOnDateTime: new Date(data.signOnDateTime),
      timeOfTO: data.timeOfTO ? new Date(data.timeOfTO) : null,
      departureDateTime: data.departureDateTime ? new Date(data.departureDateTime) : null,
      signOnStation: data.signOnStation,
      signOffStation: data.signOffStation || null,
      section: data.section,
      dutyType: data.dutyType,
      dutyHours,
      status: 'IN_PROGRESS',
      createdBy: userId,
    });

    // Create sign-on duty logs
    await DutyLog.insertMany([
      { shift: shift._id, staff: locoPilot._id, logType: 'SIGN_ON', dutyHoursAtLog: 0, remarks: 'Shift started' },
      { shift: shift._id, staff: trainManager._id, logType: 'SIGN_ON', dutyHoursAtLog: 0, remarks: 'Shift started' },
    ]);

    // Update staff status
    await Staff.updateMany({ _id: { $in: [locoPilot._id, trainManager._id] } }, { status: 'ON_DUTY' });

    const populatedShift = await this.getShiftById(shift._id.toString());
    logger.info(`✅ Shift created: ${shift._id}`);
    return populatedShift;
  }

  async getShiftById(shiftId) {
    const shift = await Shift.findById(shiftId)
      .populate('locomotive')
      .populate('locoPilot')
      .populate('trainManager')
      .populate({ path: 'createdBy', select: 'id name employeeId' })
      .populate({
        path: 'updatedBy',
        select: 'id name employeeId',
      });

    if (!shift) throw new ApiError(404, 'Shift not found');

    const dutyLogs = await DutyLog.find({ shift: shiftId })
      .sort({ logTime: -1 })
      .populate({ path: 'staff', select: 'name employeeId staffType phone' });

    const shiftObj = shift.toObject();
    shiftObj.dutyLogs = dutyLogs;

    if (shift.status === 'IN_PROGRESS' && !shift.signOffDateTime) {
      shiftObj.dutyHours = this.calculateDutyHours(shift.signOnDateTime);
    }

    return shiftObj;
  }

  async listShifts(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.trainNumber) query.trainNumber = { $regex: filters.trainNumber, $options: 'i' };
    if (filters.locoPilotId) query.locoPilot = filters.locoPilotId;
    if (filters.trainManagerId) query.trainManager = filters.trainManagerId;
    if (filters.startDate || filters.endDate) {
      query.trainArrivalDateTime = {};
      if (filters.startDate) query.trainArrivalDateTime.$gte = new Date(filters.startDate);
      if (filters.endDate) query.trainArrivalDateTime.$lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;
    const [shifts, total] = await Promise.all([
      Shift.find(query)
        .populate('locomotive')
        .populate('locoPilot')
        .populate('trainManager')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Shift.countDocuments(query),
    ]);

    const shiftsWithHours = shifts.map((shift) => {
      const obj = shift.toObject();
      if (shift.status === 'IN_PROGRESS' && !shift.signOffDateTime) {
        obj.dutyHours = this.calculateDutyHours(shift.signOnDateTime);
      }
      return obj;
    });

    return {
      shifts: shiftsWithHours,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async updateShift(shiftId, data, userId) {
    const shift = await Shift.findById(shiftId).populate('locoPilot').populate('trainManager');
    if (!shift) throw new ApiError(404, 'Shift not found');

    const updateData = { updatedBy: userId };

    if (data.timeOfTO) {
      updateData.timeOfTO = new Date(data.timeOfTO);
      await DutyLog.create({ shift: shift._id, staff: shift.locoPilot._id, logType: 'TAKE_OVER', dutyHoursAtLog: this.calculateDutyHours(shift.signOnDateTime), remarks: 'Train take over' });
    }

    if (data.departureDateTime) {
      updateData.departureDateTime = new Date(data.departureDateTime);
      await DutyLog.create({ shift: shift._id, staff: shift.locoPilot._id, logType: 'DEPARTURE', dutyHoursAtLog: this.calculateDutyHours(shift.signOnDateTime), remarks: 'Train departed' });
    }

    if (data.signOffStation) updateData.signOffStation = data.signOffStation;
    if (data.section) updateData.section = data.section;
    if (data.dutyType) updateData.dutyType = data.dutyType;
    if (data.status) updateData.status = data.status;
    if (data.reliefReason) updateData.reliefReason = data.reliefReason;

    if (data.signOffDateTime) {
      updateData.signOffDateTime = new Date(data.signOffDateTime);
      updateData.status = 'COMPLETED';
      updateData.dutyHours = this.calculateDutyHours(shift.signOnDateTime, data.signOffDateTime);

      await DutyLog.insertMany([
        { shift: shift._id, staff: shift.locoPilot._id, logType: 'RELEASE', dutyHoursAtLog: updateData.dutyHours, remarks: 'Shift completed' },
        { shift: shift._id, staff: shift.trainManager._id, logType: 'RELEASE', dutyHoursAtLog: updateData.dutyHours, remarks: 'Shift completed' },
      ]);

      await Staff.updateMany({ _id: { $in: [shift.locoPilot._id, shift.trainManager._id] } }, { status: 'AVAILABLE' });
    }

    if (data.reliefPlanned !== undefined) {
      updateData.reliefPlanned = data.reliefPlanned;
      if (data.reliefPlanned) {
        updateData.status = 'RELIEF_PLANNED';
        await DutyLog.insertMany([
          { shift: shift._id, staff: shift.locoPilot._id, logType: 'RELIEF_PLANNED', dutyHoursAtLog: this.calculateDutyHours(shift.signOnDateTime), remarks: data.reliefReason || 'Relief planned' },
          { shift: shift._id, staff: shift.trainManager._id, logType: 'RELIEF_PLANNED', dutyHoursAtLog: this.calculateDutyHours(shift.signOnDateTime), remarks: data.reliefReason || 'Relief planned' },
        ]);
      }
    }

    const updated = await Shift.findByIdAndUpdate(shiftId, updateData, { new: true })
      .populate('locomotive').populate('locoPilot').populate('trainManager');

    logger.info(`✅ Shift updated: ${shiftId}`);
    return updated;
  }

  async deleteShift(shiftId) {
    const shift = await Shift.findById(shiftId);
    if (!shift) throw new ApiError(404, 'Shift not found');
    if (shift.status === 'IN_PROGRESS') throw new ApiError(400, 'Cannot delete an in-progress shift');
    await DutyLog.deleteMany({ shift: shiftId });
    await Shift.findByIdAndDelete(shiftId);
    logger.info(`✅ Shift deleted: ${shiftId}`);
    return { message: 'Shift deleted successfully' };
  }

  async getActiveShiftsSummary() {
    const activeShifts = await Shift.find({
      status: { $in: ['IN_PROGRESS', 'RELIEF_PLANNED'] },
      signOffDateTime: null,
    }).populate('locomotive').populate('locoPilot').populate('trainManager');

    return {
      totalActive: activeShifts.length,
      shifts: activeShifts.map((shift) => {
        const dutyHours = this.calculateDutyHours(shift.signOnDateTime);
        let alertLevel = 'normal';
        if (dutyHours >= 14) alertLevel = 'critical';
        else if (dutyHours >= 11) alertLevel = 'danger';
        else if (dutyHours >= 9) alertLevel = 'high';
        else if (dutyHours >= 8) alertLevel = 'warning';
        else if (dutyHours >= 7) alertLevel = 'info';
        return { ...shift.toObject(), dutyHours, alertLevel };
      }),
    };
  }
}

export default new ShiftService();
