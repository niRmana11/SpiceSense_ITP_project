const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    category: { type: String, required: true }
});

const Stock = require("./Stock");
const Transaction = require("./Transaction")


productSchema.pre("findOneAndDelete", async function (next) {
    const product = await this.model.findOne(this.getFilter());

    if (product) {
        await Stock.deleteMany({ product: product._id });
        await Transaction.deleteMany({ product: product._id });
    }

    next();
});

module.exports = mongoose.model("Product", productSchema);
