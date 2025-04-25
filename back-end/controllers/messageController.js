import Message from "../models/messageModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";


export const createMessage = async (req, res) => {
  try {
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    
    const { productId, requestedQuantity } = req.body;

    if (!productId || !requestedQuantity || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required. Quantity must be greater than 0."
      });
    }

    
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

  
    const newMessage = new Message({
      productId,
      supplierId: product.supplierId,
      adminId: req.user.id,
      requestedQuantity: Number(requestedQuantity),
    });

    await newMessage.save();

    return res.status(201).json({
      success: true,
      message: "Request sent to supplier successfully",
      data: newMessage
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getSupplierMessages = async (req, res) => {
  try {

    const supplierId = req.user.id;

    
    const messages = await Message.find({ supplierId })
      .populate({
        path: 'productId',
        select: 'productName productCategory price'
      })
      .populate({
        path: 'adminId',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Error fetching supplier messages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getAdminMessages = async (req, res) => {
  try {
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const { status, supplierId } = req.query;
    
    
    const filter = {};
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;

    
    const messages = await Message.find(filter)
      .populate({
        path: 'productId',
        select: 'productName productCategory price'
      })
      .populate({
        path: 'supplierId',
        select: 'name email companyName'
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Error fetching admin messages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const respondToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, approvedQuantity, approvedPrice, rejectReason } = req.body;

    
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (approved or rejected) is required"
      });
    }

    
    if (status === "approved" && (!approvedQuantity || !approvedPrice)) {
      return res.status(400).json({
        success: false,
        message: "Approved quantity and price are required for approval"
      });
    }

    
    if (status === "rejected" && !rejectReason) {
      return res.status(400).json({
        success: false,
        message: "Reason for rejection is required"
      });
    }

    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    
    if (message.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    
    message.status = status;
    
    if (status === "approved") {
      message.approvedQuantity = Number(approvedQuantity);
      message.approvedPrice = Number(approvedPrice);
    } else {
      message.rejectReason = rejectReason;
    }

    await message.save();

    return res.status(200).json({
      success: true,
      message: `Request ${status}`,
      data: message
    });
  } catch (error) {
    console.error("Error responding to message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const markMessageAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;

    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    
    const isAdmin = req.user.role === 'admin';
    const isSupplier = req.user.id === message.supplierId.toString();

    if (!isAdmin && !isSupplier) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    
    message.seen = true;
    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message marked as seen"
    });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};