const express = require("express");
const CreditCard = require("../models/CreditCard");
const router = express.Router();

// 🟢 Get all credit cards for a user
router.get("/:userId", async (req, res) => {
    try {
        const cards = await CreditCard.find({ userId: req.params.userId });
        res.json(cards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔵 Add a new credit card
router.post("/", async (req, res) => {
    try {
        const { userId, cardNumber, cardHolder, expiryDate, cvv } = req.body;
        const newCard = new CreditCard({ userId, cardNumber, cardHolder, expiryDate, cvv });
        await newCard.save();
        res.json(newCard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🟡 Update a credit card
router.put("/:cardId", async (req, res) => {
    try {
        const updatedCard = await CreditCard.findByIdAndUpdate(req.params.cardId, req.body, { new: true });
        res.json(updatedCard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔴 Delete a credit card
router.delete("/:cardId", async (req, res) => {
    try {
        await CreditCard.findByIdAndDelete(req.params.cardId);
        res.json({ message: "Credit card deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
