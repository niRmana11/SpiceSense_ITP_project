// models/Payment.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Add ref
  amount: Number,
  method: String,
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "CreditCard" },
  status: { type: String, enum: ["success", "failed"], default: "success" },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);