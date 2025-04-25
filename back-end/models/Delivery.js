// models/Delivery.js
const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  status: { 
    type: String, 
    enum: ["ready for shipment", "shipped", "in transit", "delivered"],
    default: "ready for shipment" 
  },
  trackingNumber: String,
  carrier: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  deliveryNotes: String,
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: mongoose.Schema.Types.ObjectId // staff member who made the update
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Middleware to maintain status history
DeliverySchema.pre('save', function(next) {
  // If this is a new document or the status has changed
  if (this.isNew || this.isModified('status')) {
    // Add the current status to the history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.updatedBy || null // If updatedBy is provided
    });
  }
  next();
});

module.exports = mongoose.model("Delivery", DeliverySchema);