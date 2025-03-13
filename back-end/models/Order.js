const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    items: [{ spiceId: mongoose.Schema.Types.ObjectId, name: String, price: Number, quantity: Number }],
    total: Number,
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    invoiceId: String
});

module.exports = mongoose.model("Order", OrderSchema);
