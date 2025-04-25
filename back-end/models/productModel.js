import mongoose from "mongoose";

const productSupplierSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    productCategory: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      default: 0,
    },
    minimumOrderQuantity: {
      type: Number,
      required: [true, "Minimum order quantity is required"],
      min: [1, "Minimum order quantity must be at least 1"],
      default: 1,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supplier ID is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create indexes for better query performance
productSupplierSchema.index({ supplierId: 1 });
productSupplierSchema.index({ productName: "text", productCategory: "text" });

const ProductSupplier = mongoose.model("ProductSupplier", productSupplierSchema);

export default ProductSupplier;
