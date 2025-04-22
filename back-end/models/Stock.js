const mongoose = require("mongoose");


const stockSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    batches: [
        {
            batchNumber: { type: String, unique: true },
            expiryDate: { type: Date, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    totalQuantity: { type: Number, default: 0 }

});

module.exports = mongoose.model("Stock", stockSchema);