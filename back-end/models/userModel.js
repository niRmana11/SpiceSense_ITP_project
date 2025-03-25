import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true }, // Added phone field
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'supplier', 'customer', 'employee'], 
    required: true 
  },
  // Fields for Supplier
  companyName: { type: String },
  contactPerson: { type: String },
  // Fields for Employee
  jobTitle: { type: String },
  department: { type: String },
  // Fields for Admin
  permissions: { type: Array, default: ['manage-users', 'view-reports'] },
  // Fields for Customer
  shippingAddress: { type: String },
  billingAddress: { type: String },
  // OTP and account verification
  verifyOtp: { type: String, default: "0" },
  isAccountVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: "" },
  resetOtpExpireAt: { type: Number, default: 0 },
});

const userModel = mongoose.model('User', userSchema);

export default userModel;