const express = require("express");
const Payment = require("../models/Payment");
const Order = require("../models/Order");

const router = express.Router();

// Pay for an order
router.post("/", async (req, res) => {
    try {
        const { userId, orderId, method, amount } = req.body;
        const payment = new Payment({ userId, orderId, method, amount });
        await payment.save();

        await Order.findByIdAndUpdate(orderId, { status: "paid" });
        res.json({ message: "Payment successful" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// Fetch all payments
router.get("/", async (req, res) => {
    try {
      const payments = await Payment.find(); // Get all payments from DB
      res.json(payments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
