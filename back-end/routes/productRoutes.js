const express = require("express");
const multer = require("multer");
const Product = require("../models/Product");
const router = express.Router();
const path = require("path");


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");  
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);  
    },
});

const upload = multer({ storage: storage });

// Get all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
});

// add a product
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { productName, category } = req.body;

        if (!productName || !category) {
            return res.status(400).json({ error: "Product name and category are required." });
        }

        
        const imagePath = req.file ? `uploads/${req.file.filename}` : null;

        const newProduct = new Product({ productName, category, image: imagePath });
        await newProduct.save();

        res.json({ message: "Product added!", product: newProduct });
    } catch (error) {
        res.status(500).json({ error: "Error adding product", details: error.message });
    }
});

// Update product
router.put("/:id", upload.single("image"), async (req, res) => {
    try {
        const { productName, category } = req.body;
        let updateFields = { productName, category };

        if (req.file) {
            updateFields.image = req.file.filename; 
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateFields, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product updated", product: updatedProduct });
    } catch (error) {
        res.status(400).json({ message: "Error updating product", error });
    }
});



// delete a product
router.delete("/:id", async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
});


module.exports = router;