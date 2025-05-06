import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'supplier', 'customer', 'employee'], 
    required: true 
  },
  companyName: { type: String },
  contactPerson: { type: String },
  jobTitle: { type: String },
  department: { type: String },
  permissions: { type: Array, default: ['manage-users', 'view-reports'] },
  shippingAddress: { type: String },
  billingAddress: { type: String },
  verifyOtp: { type: String, default: "0" },
  isAccountVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: "" },
  resetOtpExpireAt: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }, 
});

const userModel = mongoose.model('User', userSchema);

export default userModel;