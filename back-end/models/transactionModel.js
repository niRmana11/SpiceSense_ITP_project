import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderDeliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderDelivery",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "credit_card", "check", "cash", "online_payment"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "completed", "cancelled", "refunded"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
transactionSchema.index({ supplierId: 1 });
transactionSchema.index({ orderDeliveryId: 1 });
transactionSchema.index({ invoiceNumber: 1 });
transactionSchema.index({ status: 1 });

const transactionModel = mongoose.model("transactionModel", transactionSchema);

export default transactionModel;