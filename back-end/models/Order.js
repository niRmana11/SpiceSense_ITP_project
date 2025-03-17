// models/Order.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{ itemId: mongoose.Schema.Types.ObjectId, price: Number, quantity: Number }], // Updated to itemId, removed name
  total: Number,
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  invoiceId: String,
});

module.exports = mongoose.model("Order", OrderSchema);