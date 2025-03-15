const express = require("express");
const CreditCard = require("../models/CreditCard");
const router = express.Router();

// Get user's saved credit cards
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const creditCards = await CreditCard.find({ userId });
        res.json(creditCards);
    } catch (err) {
        console.error("Error fetching credit cards:", err);
        res.status(500).json({ error: "Server error" });
    }
});

//  Add a new credit card
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

//  Update a credit card
router.put("/:cardId", async (req, res) => {
    try {
        const updatedCard = await CreditCard.findByIdAndUpdate(req.params.cardId, req.body, { new: true });
        res.json(updatedCard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  Delete a credit card
router.delete("/:cardId", async (req, res) => {
    try {
        await CreditCard.findByIdAndDelete(req.params.cardId);
        res.json({ message: "Credit card deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
