import mongoose from "mongoose";

const shipmentDeliverySchema = new mongoose.Schema(
  {
    orderDeliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderDelivery",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    carrier: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["preparing", "shipped", "in_transit", "out_for_delivery", "delivered", "failed_delivery"],
      default: "preparing",
    },
    expectedDeliveryDate: {
      type: Date,
      required: true,
    },
    actualDeliveryDate: {
      type: Date,
      default: null,
    },
    deliveryNotes: {
      type: String,
      default: "",
    },
    proofOfDelivery: {
      type: String,
      default: "",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
shipmentDeliverySchema.index({ supplierId: 1 });
shipmentDeliverySchema.index({ orderDeliveryId: 1 });
shipmentDeliverySchema.index({ status: 1 });

const ShipmentDelivery = mongoose.model("ShipmentDelivery", shipmentDeliverySchema);

export default ShipmentDelivery;