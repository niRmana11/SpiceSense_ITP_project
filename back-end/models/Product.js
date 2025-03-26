const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    category: { type: String, enum: ["Raw Material", "Finished Product"], required: true },
    image: { type: String, required: true },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;