const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

// Get user orders
router.get("/:userId", async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
