// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const CreditCard = require("../models/CreditCard");

// Fetch saved credit cards for a user
router.get("/cards/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const cards = await CreditCard.find({ userId });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch credit cards" });
    }
});

// Process payment
router.post("/pay", async (req, res) => {
    try {
        const { userId, orderId, cardId, cardDetails } = req.body;
        
        // Fetch the order
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });
        
        if (order.status === "paid") {
            return res.status(400).json({ error: "Order already paid" });
        }
        
        // Handle saved or new credit card
        let paymentCard;
        if (cardId) {
            paymentCard = await CreditCard.findById(cardId);
            if (!paymentCard) return res.status(404).json({ error: "Card not found" });
        } else {
            paymentCard = new CreditCard({
                userId,
                cardNumber: cardDetails.cardNumber,
                expiryDate: cardDetails.expiryDate,
                cvv: cardDetails.cvv,
                nameOnCard: cardDetails.nameOnCard,
            });
            await paymentCard.save();
        }

        // Simulate payment processing
        const payment = new Payment({ userId, orderId, amount: order.total, cardId: paymentCard._id });
        await payment.save();

        // Update order status
        order.status = "paid";
        await order.save();
        
        // Generate invoice
        const invoice = new Invoice({ userId, orderId, amount: order.total, status: "generated" });
        await invoice.save();
        
        res.json({ message: "Payment successful", invoiceId: invoice._id });
    } catch (error) {
        res.status(500).json({ error: "Payment failed" });
    }
});

module.exports = router;
