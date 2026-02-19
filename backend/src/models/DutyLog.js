import mongoose from 'mongoose';

const DUTY_LOG_TYPES = [
  'SIGN_ON', 'TAKE_OVER', 'DEPARTURE', 'MILESTONE',
  'ALERT_7HR', 'ALERT_8HR', 'ALERT_9HR', 'ALERT_10HR', 'ALERT_11HR', 'ALERT_14HR',
  'RELIEF_PLANNED', 'RELIEF_NOT_REQUIRED', 'CREW_RELIEVED', 'CREW_NOT_BOOKED',
  'KEEP_ON_DUTY', 'CREW_ALREADY_RELIEVED', 'RELEASE',
];

const dutyLogSchema = new mongoose.Schema(
  {
    shift:          { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    staff:          { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    logType:        { type: String, enum: DUTY_LOG_TYPES, required: true },
    logTime:        { type: Date, default: Date.now },
    dutyHoursAtLog: { type: Number, default: null },
    remarks:        { type: String, default: null },
    metadata:       { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

dutyLogSchema.index({ shift: 1 });
dutyLogSchema.index({ staff: 1 });
dutyLogSchema.index({ logType: 1 });
dutyLogSchema.index({ logTime: -1 });

const DutyLog = mongoose.model('DutyLog', dutyLogSchema);
export default DutyLog;
