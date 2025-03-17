const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  status: { type: String, enum: ["success", "failed"], required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", paymentSchema);
