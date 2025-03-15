const mongoose = require("mongoose");

const CreditCardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cardNumber: { type: String, required: true },
    cardHolder: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cvv: { type: String, required: true }, // For simplicity (Don't store CVV in real apps!)
});

module.exports = mongoose.model("CreditCard", CreditCardSchema);
