import mongoose from 'mongoose';

const locomotiveSchema = new mongoose.Schema(
  {
    locomotiveNo: { type: String, required: true, unique: true, trim: true },
    status:       { type: String, default: 'ACTIVE' },
    autoCreated:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// locomotiveSchema.index({ locomotiveNo: 1 });

const Locomotive = mongoose.model('Locomotive', locomotiveSchema);
export default Locomotive;
