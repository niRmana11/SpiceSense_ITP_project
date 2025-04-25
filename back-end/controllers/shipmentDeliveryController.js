import ShipmentDelivery from "../models/shipmentDeliveryModel.js";
import OrderDelivery from "../models/orderDeliveryModel.js";

// Create a new shipment
export const createShipment = async (req, res) => {
  try {
    const { orderDeliveryId, trackingNumber, carrier, expectedDeliveryDate, deliveryNotes } = req.body;
    
    if (!orderDeliveryId || !expectedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: "Order ID and expected delivery date are required"
      });
    }
    
    // Find the order
    const order = await OrderDelivery.findById(orderDeliveryId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Verify the order belongs to this supplier
    if (order.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    // Check if order is ready for shipment
    if (order.orderStatus !== "ready_for_shipment") {
      return res.status(400).json({
        success: false,
        message: "Order must be marked as ready for shipment first"
      });
    }
    
    // Check if a shipment already exists
    const existingShipment = await ShipmentDelivery.findOne({ orderDeliveryId });
    if (existingShipment) {
      return res.status(400).json({
        success: false,
        message: "Shipment already exists for this order"
      });
    }
    
    // Create new shipment
    const newShipment = new ShipmentDelivery({
      orderDeliveryId,
      supplierId: req.user.id,
      trackingNumber: trackingNumber || "",
      carrier: carrier || "",
      status: "preparing",
      expectedDeliveryDate: new Date(expectedDeliveryDate),
      deliveryNotes: deliveryNotes || ""
    });
    
    await newShipment.save();
    
    // Update order status to shipped
    order.orderStatus = "shipped";
    order.trackingInfo = trackingNumber || "";
    order.expectedDeliveryDate = new Date(expectedDeliveryDate);
    if (deliveryNotes) order.deliveryNotes = deliveryNotes;
    
    await order.save();
    
    return res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      shipment: newShipment
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get all shipments for a supplier
export const getSupplierShipments = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build filter
    const filter = { supplierId: req.user.id };
    if (status) {
      filter.status = status;
    }
    
    // Find shipments
    const shipments = await ShipmentDelivery.find(filter)
      .populate({
        path: 'orderDeliveryId',
        populate: {
          path: 'productId',
          select: 'productName productCategory'
        }
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      shipments
    });
  } catch (error) {
    console.error("Error fetching supplier shipments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get shipments for admin
export const getAdminShipments = async (req, res) => {
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
    if (status) filter.status = status;
    
    // Find shipments
    const shipments = await ShipmentDelivery.find(filter)
      .populate({
        path: 'orderDeliveryId',
        populate: [
          {
            path: 'productId',
            select: 'productName productCategory'
          },
          {
            path: 'supplierId',
            select: 'name email companyName'
          }
        ]
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      shipments
    });
  } catch (error) {
    console.error("Error fetching admin shipments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get a single shipment
export const getShipmentById = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    const shipment = await ShipmentDelivery.findById(shipmentId)
      .populate({
        path: 'orderDeliveryId',
        populate: [
          {
            path: 'productId',
            select: 'productName productCategory'
          },
          {
            path: 'supplierId',
            select: 'name email companyName'
          },
          {
            path: 'adminId',
            select: 'name email'
          }
        ]
      });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found"
      });
    }
    
    // Check if user has permission to view this shipment
    if (req.user.role !== 'admin' && shipment.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    return res.status(200).json({
      success: true,
      shipment
    });
  } catch (error) {
    console.error("Error fetching shipment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update shipment status
export const updateShipmentStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, trackingNumber, carrier, deliveryNotes, actualDeliveryDate } = req.body;
    
    const shipment = await ShipmentDelivery.findById(shipmentId);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found"
      });
    }
    
    // Check if user has permission to update this shipment
    if (shipment.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    // Update shipment
    if (status) {
      // Validate status transitions
      const validTransitions = {
        "preparing": ["shipped"],
        "shipped": ["in_transit", "delivered"],
        "in_transit": ["out_for_delivery", "delivered", "failed_delivery"],
        "out_for_delivery": ["delivered", "failed_delivery"],
        "failed_delivery": ["in_transit", "out_for_delivery", "delivered"]
      };
      
      if (!validTransitions[shipment.status] || !validTransitions[shipment.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${shipment.status} to ${status}`
        });
      }
      
      shipment.status = status;
      shipment.lastUpdated = new Date();
      
      // If marking as delivered, update the related order as well
      if (status === "delivered") {
        if (!actualDeliveryDate) {
          return res.status(400).json({
            success: false,
            message: "Actual delivery date is required when marking as delivered"
          });
        }
        
        shipment.actualDeliveryDate = new Date(actualDeliveryDate);
        
        // Update the related order
        const order = await OrderDelivery.findById(shipment.orderDeliveryId);
        if (order) {
          order.orderStatus = "delivered";
          order.actualDeliveryDate = new Date(actualDeliveryDate);
          await order.save();
        }
      }
    }
    
    if (trackingNumber) shipment.trackingNumber = trackingNumber;
    if (carrier) shipment.carrier = carrier;
    if (deliveryNotes) shipment.deliveryNotes = deliveryNotes;
    
    await shipment.save();
    
    return res.status(200).json({
      success: true,
      message: "Shipment updated successfully",
      shipment
    });
  } catch (error) {
    console.error("Error updating shipment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};