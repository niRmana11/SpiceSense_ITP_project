const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Stock = require("../models/Stock");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");


// fetch stock data
router.get("/inventory", async (req, res) => {
    try {
        const today = new Date();
        const stockData = await Stock.find().populate("product", "productName category");

        const filteredStockData = stockData.filter(stock => stock.product);

        const formattedData = filteredStockData.map(stock => {
            const expiredBatches = stock.batches
                .filter(batch => new Date(batch.expiryDate) < today)
                .map(batch => ({
                    batchNumber: batch.batchNumber,
                    name: stock.product?.productName || "Unknown"
                }));

            return {
                id: stock._id,
                name: stock.product?.productName || "Unknown",
                category: stock.product?.category || "Unknown",
                quantity: stock.totalQuantity || stock.batches.reduce((acc, batch) => acc + batch.quantity, 0),
                expiredBatches
            };
        });

        res.json(formattedData);
    } catch (error) {
        console.error("Error fetching inventory data:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// Get all stock levels
router.get("/", async (req, res) => {
    try {

        const stocks = await Stock.find().populate("product");

        res.json(stocks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching stock levels", error });
    }
});



// Add new stock batch (Stock In)
router.post("/add", async (req, res) => {
    try {
        const { productId, expiryDate, quantity } = req.body;

        let stock = await Stock.findOne({ product: productId });

        const allStocks = await Stock.find();
        let highestBatchNumber = 0;

        allStocks.forEach(s => {
            s.batches.forEach(batch => {
                const batchNumber = parseInt(batch.batchNumber.split("-")[1]);
                if (!isNaN(batchNumber) && batchNumber > highestBatchNumber) {
                    highestBatchNumber = batchNumber;
                }
            });
        });

        if (!stock) {
            stock = new Stock({ product: productId, batches: [], totalQuantity: 0 });
        }

        const nextBatchNumber = `B-${highestBatchNumber + 1}`;


        stock.batches.push({ batchNumber: nextBatchNumber, expiryDate, quantity: Number(quantity) });
        stock.totalQuantity += Number(quantity);

        await stock.save();

        // Log Stock In transaction
        const transaction = new Transaction({
            product: productId,
            type: "Stock In",
            quantity: Number(quantity),
            batchNumber: nextBatchNumber
        });

        await transaction.save();

        res.json({ stock });

    } catch (error) {
        res.status(400).json({ message: "Error adding stock batch", error });
    }
});


// Update a batch
router.put("/edit/:stockId/:batchNumber", async (req, res) => {
    try {
        const { stockId, batchNumber } = req.params;
        const { expiryDate, quantity } = req.body;

        let stock = await Stock.findById(stockId);
        if (!stock) return res.status(404).json({ message: "Stock not found" });

        let batch = stock.batches.find(batch => batch.batchNumber === batchNumber);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        batch.expiryDate = expiryDate;
        batch.quantity = Number(quantity);


        stock.totalQuantity = stock.batches.reduce((sum, b) => sum + b.quantity, 0);

        await stock.save();
        res.json({ message: "Batch updated successfully!", stock });

    } catch (error) {
        res.status(400).json({ message: "Error updating batch", error });
    }
});

// Delete a batch
router.delete("/delete/:stockId/:batchNumber", async (req, res) => {
    try {
        const { stockId, batchNumber } = req.params;


        if (!mongoose.Types.ObjectId.isValid(stockId)) {
            return res.status(400).json({ message: "Invalid stock ID" });
        }

        let stock = await Stock.findById(stockId);
        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }

        const originalLength = stock.batches.length;
        stock.batches = stock.batches.filter(batch => batch.batchNumber !== batchNumber);

        if (stock.batches.length === originalLength) {
            return res.status(404).json({ message: "Batch not found" });
        }

        stock.totalQuantity = stock.batches.reduce((sum, b) => sum + b.quantity, 0);
        await stock.save();

        res.json({ message: "Batch deleted successfully", stock });

    } catch (error) {
        console.error("Error deleting batch:", error);
        res.status(400).json({ message: "Error deleting batch", error });
    }
});


// Sell product (Stock Out)
router.post("/sell", async (req, res) => {
    try {
        const { soldProductId, soldQuantity } = req.body;
        const quantityToDeduct = soldQuantity;

        const stock = await Stock.findOne({ product: soldProductId }).populate("product");
        if (!stock) return res.status(404).json({ message: "Stock not found" });

        if (stock.totalQuantity < quantityToDeduct) {
            return res.status(400).json({ message: "Not enough stock available" });
        }

        let remainingQuantity = quantityToDeduct;
        let soldBatches = [];

        for (let batch of stock.batches) {
            if (remainingQuantity === 0) break;

            if (batch.quantity >= remainingQuantity) {
                batch.quantity -= remainingQuantity;
                soldBatches.push({ batchNo: batch.batchNumber, quantity: remainingQuantity });
                remainingQuantity = 0;
            } else {
                remainingQuantity -= batch.quantity;
                soldBatches.push({ batchNo: batch.batchNumber, quantity: batch.quantity });
                batch.quantity = 0;
            }
        }

        stock.batches = stock.batches.filter(batch => batch.quantity > 0);
        stock.totalQuantity -= quantityToDeduct;

        await stock.save();

        // Log Stock Out transactions
        for (const batch of soldBatches) {
            const transaction = new Transaction({
                product: soldProductId,
                type: "Stock Out",
                quantity: batch.quantity,
                batchNumber: batch.batchNo
            });
            await transaction.save();
        }

        res.status(200).json({ message: "Stock updated successfully!", stock });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Fetch all transactions
router.get("/transactions", async (req, res) => {
    try {
        const transactions = await Transaction.find().populate("product", "productName category");

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions", error });
    }
});



// fetch expiring products
router.get("/expiry", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allItems = await Stock.find().populate("product", "productName category");

        const sortedItems = allItems.flatMap(item => {
            if (!Array.isArray(item.batches)) {
                console.warn(`Item ${item._id} has no valid batches.`);
                return [];
            }

            return item.batches.map(batch => {
                if (!batch.batchNumber) {
                    console.warn(`Batch missing batchNumber in item ${item._id}`);
                }

                const expiry = new Date(batch.expiryDate);
                expiry.setHours(0, 0, 0, 0);

                const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                let status;

                if (diffDays <= 0) status = "Expired";
                else if (diffDays <= 30) status = "Nearing-expiry";
                else status = "Safe";

                return {
                    batchNo: batch.batchNumber || "Unknown",
                    name: item.product?.productName || "Unknown",
                    expiryDate: expiry.toISOString().split("T")[0],
                    status
                };
            });
        });

        sortedItems.sort((a, b) => {
            const statusOrder = { "Expired": 0, "Nearing-expiry": 1, "Safe": 2 };
            return statusOrder[a.status] - statusOrder[b.status];
        });

        res.json(sortedItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching expiry data" });
    }
});



// Fetch stock data with batch details
router.get("/searchFilter", async (req, res) => {
    try {
        const stockData = await Stock.find().populate("product", "productName category");

        const formattedData = stockData.map(stock => ({
            id: stock._id,
            product: {
                productName: stock.product?.productName || "Unknown",
                category: stock.product?.category || "Unknown"
            },
            totalQuantity: stock.totalQuantity || 0,
            batches: stock.batches.map(batch => ({
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
            }))
        }));

        res.json(formattedData);
    } catch (error) {
        console.error("Error fetching stock data:", error);
        res.status(500).json({ message: "Server error" });
    }
});




module.exports = router;
