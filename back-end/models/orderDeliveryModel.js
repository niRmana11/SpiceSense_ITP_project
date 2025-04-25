import mongoose from "mongoose";

const orderDeliverySchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductSupplier",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderStatus: {
      type: String,
      enum: ["approved", "ready_for_shipment", "shipped", "delivered", "cancelled"],
      default: "approved",
    },
    readyDate: {
      type: Date,
      default: null,
    },
    trackingInfo: {
      type: String,
      default: "",
    },
    deliveryNotes: {
      type: String,
      default: "",
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    actualDeliveryDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
orderDeliverySchema.index({ supplierId: 1 });
orderDeliverySchema.index({ messageId: 1 });
orderDeliverySchema.index({ orderStatus: 1 });

const OrderDelivery = mongoose.model("OrderDelivery", orderDeliverySchema);

export default OrderDelivery;