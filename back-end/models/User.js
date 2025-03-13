const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["admin", "customer", "supplier", "employee"], default: "customer" },
    creditCards: [{ number: String, expiry: String, cvv: String }]
});

module.exports = mongoose.model("User", UserSchema);
