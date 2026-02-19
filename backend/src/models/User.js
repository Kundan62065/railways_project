import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:      { type: String, default: null },
    password:   { type: String, required: true },
    role:       { type: String, enum: ['SUPERADMIN', 'ADMIN', 'USER'], default: 'USER' },
    status:     { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'INACTIVE' },

    // Verification & Approval
    isVerified:       { type: Boolean, default: false },
    verifiedAt:       { type: Date, default: null },
    verifiedBy:       { type: String, default: null },  // employeeId of approver
    rejectedAt:       { type: Date, default: null },
    rejectedBy:       { type: String, default: null },
    rejectionReason:  { type: String, default: null },

    // Additional Info
    division:     { type: String, default: null },
    designation:  { type: String, default: null },
    lastLogin:    { type: Date, default: null },
  },
  { timestamps: true }
);

// userSchema.index({ employeeId: 1 });
// userSchema.index({ email: 1 });
// userSchema.index({ isVerified: 1 });
// userSchema.index({ status: 1 });

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
