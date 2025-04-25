import OrderDelivery from "../models/orderDeliveryModel.js";
import Message from "../models/messageModel.js";
import Product from "../models/productModel.js";

// Create an order delivery from an approved message
export const createOrderDelivery = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Verify user is a supplier
    if (req.user.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Suppliers only."
      });
    }
    
    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }
    
    // Verify message belongs to this supplier
    if (message.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    // Check if message is approved
    if (message.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved messages can be converted to orders"
      });
    }
    
    // Check if order already exists for this message
    const existingOrder = await OrderDelivery.findOne({ messageId });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Order delivery already exists for this message"
      });
    }
    
    // Calculate total amount
    const totalAmount = message.approvedQuantity * message.approvedPrice;
    
    // Create new order delivery
    const newOrderDelivery = new OrderDelivery({
      messageId: message._id,
      supplierId: message.supplierId,
      adminId: message.adminId,
      productId: message.productId,
      quantity: message.approvedQuantity,
      price: message.approvedPrice,
      totalAmount,
      orderStatus: "approved"
    });
    
    await newOrderDelivery.save();
    
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrderDelivery
    });
  } catch (error) {
    console.error("Error creating order delivery:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get all order deliveries for a supplier
export const getSupplierOrderDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build filter
    const filter = { supplierId: req.user.id };
    if (status) {
      filter.orderStatus = status;
    }
    
    // Find orders
    const orders = await OrderDelivery.find(filter)
      .populate({
        path: 'productId',
        select: 'productName productCategory'
      })
      .populate({
        path: 'adminId',
        select: 'name email'
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Error fetching supplier orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get admin order deliveries
export const getAdminOrderDeliveries = async (req, res) => {
  try {
    // Verify user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }
    
    const { supplierId, status } = req.query;
    
    // Build filter
    const filter = {};
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.orderStatus = status;
    
    // Find orders
    const orders = await OrderDelivery.find(filter)
      .populate({
        path: 'productId',
        select: 'productName productCategory'
      })
      .populate({
        path: 'supplierId',
        select: 'name email companyName'
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get a single order delivery
export const getOrderDeliveryById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await OrderDelivery.findById(orderId)
      .populate({
        path: 'productId',
        select: 'productName productCategory'
      })
      .populate({
        path: 'supplierId',
        select: 'name email companyName'
      })
      .populate({
        path: 'adminId',
        select: 'name email'
      });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Check if user has permission to view this order
    if (req.user.role !== 'admin' && order.supplierId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update order delivery status
export const updateOrderDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, trackingInfo, deliveryNotes, expectedDeliveryDate } = req.body;
    
    const order = await OrderDelivery.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Check if user has permission to update this order
    if (req.user.role !== 'admin' && order.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    // Update fields
    if (orderStatus) {
      // Validate status transition
      if (orderStatus === "ready_for_shipment" && order.orderStatus === "approved") {
        order.orderStatus = orderStatus;
        order.readyDate = new Date();
      } else if (orderStatus === "shipped" && ["approved", "ready_for_shipment"].includes(order.orderStatus)) {
        order.orderStatus = orderStatus;
      } else if (orderStatus === "delivered" && ["approved", "ready_for_shipment", "shipped"].includes(order.orderStatus)) {
        order.orderStatus = orderStatus;
        order.actualDeliveryDate = new Date();
      } else if (orderStatus === "cancelled" && ["approved", "ready_for_shipment"].includes(order.orderStatus)) {
        order.orderStatus = orderStatus;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid status transition"
        });
      }
    }
    
    if (trackingInfo) order.trackingInfo = trackingInfo;
    if (deliveryNotes) order.deliveryNotes = deliveryNotes;
    if (expectedDeliveryDate) order.expectedDeliveryDate = new Date(expectedDeliveryDate);
    
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};