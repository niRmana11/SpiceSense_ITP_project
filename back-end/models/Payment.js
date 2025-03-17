// models/Payment.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  orderId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  method: String,
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "CreditCard" }, // Reference to CreditCard
  status: { type: String, enum: ["success", "failed"], default: "success" },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);