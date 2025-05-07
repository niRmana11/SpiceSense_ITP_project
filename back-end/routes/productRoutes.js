const express = require("express");
const Product = require("../models/Product");
const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
});

// Add a product
router.post("/", async (req, res) => {
    try {
        const { productName, category } = req.body;

        if (!productName || !category) {
            return res.status(400).json({ error: "Product name and category are required." });
        }

        const newProduct = new Product({ productName, category });
        await newProduct.save();

        res.json({ message: "Product added!", product: newProduct });
    } catch (error) {
        res.status(500).json({ error: "Error adding product", details: error.message });
    }
});

// Update product
router.put("/:id", async (req, res) => {
    try {
        const { productName, category } = req.body;
        const updateFields = { productName, category };

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateFields, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product updated", product: updatedProduct });
    } catch (error) {
        res.status(400).json({ message: "Error updating product", error });
    }
});

// Delete a product
router.delete("/:id", async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }


        res.json({ message: "Product and related stocks deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
});


module.exports = router;
