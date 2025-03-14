const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
  expiryDate: String
});

module.exports = mongoose.model("Item", ItemSchema);
