// routes/payments.js
const express = require("express");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Item = require("../models/Item");
const PDFDocument = require("pdfkit");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("Payment request body:", req.body);
    const { userId, orderId, amount, cardId } = req.body;

    if (!userId || !orderId || !amount || !cardId) {
      return res.status(400).json({ error: "Missing required fields: userId, orderId, amount, or cardId" });
    }

    const payment = new Payment({
      userId,
      orderId,
      amount,
      method: "credit_card",
      cardId,
    });

    console.log("Saving payment:", payment);
    await payment.save();

    console.log("Updating order status for orderId:", orderId);
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: "paid" }, { new: true });
    if (!updatedOrder) {
      throw new Error("Order not found or update failed");
    }

    res.status(200).json({ message: "Payment successful", paymentId: payment._id });
  } catch (err) {
    console.error("Payment processing error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/invoice/:paymentId", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate("orderId")
      .populate("cardId");
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const order = payment.orderId;
    const card = payment.cardId;

    if (!order) {
      throw new Error("Order not found in payment");
    }
    if (!card) {
      throw new Error("Card details not found in payment");
    }

    // Fetch item details from the items collection
    let itemIds = [];
    if (Array.isArray(order.items)) {
      itemIds = order.items.map((item) => item.itemId);
    }
    const items = await Item.find({ _id: { $in: itemIds } });
    const itemsMap = items.reduce((acc, item) => {
      acc[item._id.toString()] = item.name;
      return acc;
    }, {});

    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${payment._id}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Payment ID: ${payment._id}`);
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`);
    doc.moveDown();

    doc.text("Items:");
    if (Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach((item) => {
        const itemName = itemsMap[item.itemId.toString()] || "Unknown Item";
        doc.text(`${itemName} - ${item.quantity || 0} x $${(item.price || 0).toFixed(2)}`);
      });
    } else {
      doc.text("No items found in this order.");
    }
    doc.moveDown();
    doc.text(`Total: $${(order.total || 0).toFixed(2)}`);
    doc.moveDown();

    doc.text(`Paid with: **** **** **** ${card.cardNumber.slice(-4)}`);
    doc.text(`Card Holder: ${card.cardHolder}`);

    doc.end();
  } catch (err) {
    console.error("Invoice generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;