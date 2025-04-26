const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: { type: String, enum: ["Stock In", "Stock Out"], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    batchNumber: { type: String }
});

module.exports = mongoose.model("Transactionnormal", transactionSchema);//this was originally Transaction
//changed cause back-end would start because transactionModel is also exported with the same name