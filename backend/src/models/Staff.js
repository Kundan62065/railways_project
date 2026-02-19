import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    employeeId:   { type: String, required: true, unique: true, trim: true },
    name:         { type: String, required: true, trim: true },
    staffType:    { type: String, enum: ['LOCO_PILOT', 'TRAIN_MANAGER'], required: true },
    phone:        { type: String, default: null },
    email:        { type: String, default: null },
    homeStation:  { type: String, default: null },
    status:       { type: String, enum: ['AVAILABLE', 'ON_DUTY', 'ON_LEAVE', 'RELIEVED', 'INACTIVE'], default: 'AVAILABLE' },
    autoCreated:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

staffSchema.index({ employeeId: 1 });
staffSchema.index({ name: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ staffType: 1 });

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
