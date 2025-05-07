const express = require("express");
const CreditCard = require("../models/CreditCard");
const router = express.Router();

// Validation functions
const validateCardNumber = (cardNumber) => {
  if (!cardNumber) return "Card number is required";
  const cleanNumber = cardNumber.replace(/\s/g, "");
  if (!/^\d+$/.test(cleanNumber)) return "Card number must contain only digits";
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return "Card number must be between 13 and 19 digits";
  }
  return null;
};

const validateCardHolder = (cardHolder) => {
  if (!cardHolder || !cardHolder.trim()) return "Cardholder name is required";
  return null;
};

const validateExpiryDate = (expiryDate) => {
  if (!expiryDate) return "Expiry date is required";
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return "Expiry date must be in MM/YY format";

  const [month, year] = expiryDate.split("/").map(Number);
  if (month < 1 || month > 12) return "Month must be between 01 and 12";

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // Last two digits
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const fullYear = 2000 + year;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "Card has expired";
  }

  return null;
};

const validateCvv = (cvv) => {
  if (!cvv) return "CVV is required";
  if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3 or 4 digits";
  return null;
};

const validateCreditCard = (cardData) => {
  const errors = {};

  const cardNumberError = validateCardNumber(cardData.cardNumber);
  if (cardNumberError) errors.cardNumber = cardNumberError;

  const cardHolderError = validateCardHolder(cardData.cardHolder);
  if (cardHolderError) errors.cardHolder = cardHolderError;

  const expiryDateError = validateExpiryDate(cardData.expiryDate);
  if (expiryDateError) errors.expiryDate = expiryDateError;

  const cvvError = validateCvv(cardData.cvv);
  if (cvvError) errors.cvv = cvvError;

  return Object.keys(errors).length > 0 ? errors : null;
};

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
    console.error("Error fetching credit cards:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Add a new credit card
router.post("/", async (req, res) => {
  try {
    const { userId, cardNumber, cardHolder, expiryDate, cvv } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Validate credit card fields
    const validationErrors = validateCreditCard({ cardNumber, cardHolder, expiryDate, cvv });
    if (validationErrors) {
      return res.status(400).json({ errors: validationErrors });
    }

    const newCard = new CreditCard({ userId, cardNumber, cardHolder, expiryDate, cvv });
    await newCard.save();
    res.json(newCard);
  } catch (err) {
    console.error("Error adding credit card:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a credit card
router.put("/:cardId", async (req, res) => {
  try {
    const cardId = req.params.cardId;
    if (!cardId) {
      return res.status(400).json({ error: "Card ID is required" });
    }

    const { cardNumber, cardHolder, expiryDate, cvv } = req.body;

    // Validate credit card fields if provided
    const fieldsToUpdate = { cardNumber, cardHolder, expiryDate, cvv };
    const validationErrors = validateCreditCard(fieldsToUpdate);
    if (validationErrors) {
      return res.status(400).json({ errors: validationErrors });
    }

    const updatedCard = await CreditCard.findByIdAndUpdate(
      cardId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ error: "Credit card not found" });
    }

    res.json(updatedCard);
  } catch (err) {
    console.error("Error updating credit card:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a credit card
router.delete("/:cardId", async (req, res) => {
  try {
    const cardId = req.params.cardId;
    if (!cardId) {
      return res.status(400).json({ error: "Card ID is required" });
    }

    const deletedCard = await CreditCard.findByIdAndDelete(cardId);
    if (!deletedCard) {
      return res.status(404).json({ error: "Credit card not found" });
    }

    res.json({ message: "Credit card deleted successfully" });
  } catch (err) {
    console.error("Error deleting credit card:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;