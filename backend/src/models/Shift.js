import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    // Train & Locomotive Info
    trainNumber:    { type: String, required: true, trim: true },
    trainName:      { type: String, default: null },
    locomotive:     { type: mongoose.Schema.Types.ObjectId, ref: 'Locomotive', required: true },
    locomotiveNo:   { type: String },  // Denormalized for fast access

    // Staff Assignment
    locoPilot:      { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    trainManager:   { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },

    // Time Tracking
    trainArrivalDateTime: { type: Date, required: true },
    signOnDateTime:       { type: Date, required: true },
    timeOfTO:             { type: Date, default: null },
    departureDateTime:    { type: Date, default: null },
    signOffDateTime:      { type: Date, default: null },

    signOnStation:  { type: String, required: true },
    signOffStation: { type: String, default: null },
    section:        { type: String, required: true },

    // Duty Hours Calculation
    dutyType:   { type: String, enum: ['SP', 'WR', 'LR'], required: true },
    dutyHours:  { type: Number, default: null },

    // Status
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'RELIEF_PLANNED', 'CANCELLED'],
      default: 'IN_PROGRESS',
    },

    // Alert Tracking - 7HR
    alert7HrSent:   { type: Boolean, default: false },
    alert7HrSentAt: { type: Date, default: null },

    // Alert Tracking - 8HR
    alert8HrSent:     { type: Boolean, default: false },
    alert8HrSentAt:   { type: Date, default: null },
    alert8HrResponse: { type: String, default: null }, // PLAN_RELIEF | RELIEF_NOT_REQUIRED

    // Alert Tracking - 9HR
    alert9HrSent:     { type: Boolean, default: false },
    alert9HrSentAt:   { type: Date, default: null },
    alert9HrResponse: { type: String, default: null }, // CREW_RELIEVED | CREW_NOT_BOOKED

    // Alert Tracking - 10HR
    alert10HrSent:     { type: Boolean, default: false },
    alert10HrSentAt:   { type: Date, default: null },
    alert10HrResponse: { type: String, default: null },

    // Alert Tracking - 11HR
    alert11HrSent:     { type: Boolean, default: false },
    alert11HrSentAt:   { type: Date, default: null },
    alert11HrResponse: { type: String, default: null }, // KEEP_ON | CREW_ALREADY_RELIEVED

    // Alert Tracking - 14HR
    alert14HrSent:     { type: Boolean, default: false },
    alert14HrSentAt:   { type: Date, default: null },
    alert14HrResponse: { type: String, default: null },

    // Relief Info
    reliefRequired: { type: Boolean, default: false },
    reliefPlanned:  { type: Boolean, default: false },
    reliefTime:     { type: Date, default: null },
    reliefReason:   { type: String, default: null },

    // Audit
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

shiftSchema.index({ trainNumber: 1 });
shiftSchema.index({ locoPilot: 1 });
shiftSchema.index({ trainManager: 1 });
shiftSchema.index({ status: 1 });
shiftSchema.index({ signOnDateTime: 1 });
shiftSchema.index({ trainArrivalDateTime: 1 });

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
