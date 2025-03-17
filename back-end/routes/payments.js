const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");

// Process Payment
router.post("/", async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    // Check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // Simulated payment processing (since there's no real gateway)
    const payment = new Payment({
      orderId,
      amount: order.total,
      method: paymentMethod || "Saved Credit Card",
      status: "success",
      timestamp: new Date(),
    });

    await payment.save();

    // Update order status to 'Paid'
    order.status = "paid";
    await order.save();

    // Generate invoice
    const invoice = new Invoice({
      orderId,
      userId: order.userId,
      total: order.total,
      date: new Date(),
    });
    await invoice.save();

    res.status(200).json({ message: "Payment successful", invoiceId: invoice._id });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
