import Transaction from "../models/transactionModel.js";
import OrderDelivery from "../models/orderDeliveryModel.js";
import User from "../models/userModel.js";

// Generate a unique invoice number
const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `INV-${year}${month}-`;
  
  // Get the latest invoice number with this prefix
  const latestTransaction = await Transaction.findOne(
    { invoiceNumber: { $regex: `^${prefix}` } },
    {},
    { sort: { invoiceNumber: -1 } }
  );
  
  let nextNumber = 1;
  if (latestTransaction) {
    const latestNumber = parseInt(latestTransaction.invoiceNumber.split('-')[2]);
    nextNumber = latestNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// Create a new transaction
export const createTransaction = async (req, res) => {
  try {
    // Verify admin permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }
    
    const { 
      orderDeliveryId, 
      amount, 
      paymentMethod, 
      dueDate, 
      notes 
    } = req.body;
    
    // Validate required fields
    if (!orderDeliveryId || !amount || !paymentMethod || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
    
    // Get the order delivery
    const orderDelivery = await OrderDelivery.findById(orderDeliveryId);
    if (!orderDelivery) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Check if transaction already exists for this order
    const existingTransaction = await Transaction.findOne({ orderDeliveryId });
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "Transaction already exists for this order"
      });
    }
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Create the transaction
    const newTransaction = new Transaction({
      invoiceNumber,
      orderDeliveryId,
      supplierId: orderDelivery.supplierId,
      adminId: req.user.id,
      amount,
      paymentMethod,
      dueDate: new Date(dueDate),
      notes: notes || "",
      status: "pending"
    });
    
    await newTransaction.save();
    
    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction: newTransaction
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get supplier transactions
export const getSupplierTransactions = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { status } = req.query;
    
    // Build query
    const query = { supplierId };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Get transactions
    const transactions = await Transaction.find(query)
      .populate({
        path: 'orderDeliveryId',
        populate: {
          path: 'productId',
          select: 'productName productCategory'
        }
      })
      .populate({
        path: 'adminId',
        select: 'name email'
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error("Error fetching supplier transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get admin transactions
export const getAdminTransactions = async (req, res) => {
  try {
    // Verify admin permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }
    
    const { status, supplierId } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (supplierId) {
      query.supplierId = supplierId;
    }
    
    // Get transactions
    const transactions = await Transaction.find(query)
      .populate({
        path: 'orderDeliveryId',
        populate: {
          path: 'productId',
          select: 'productName productCategory'
        }
      })
      .populate({
        path: 'supplierId',
        select: 'name email companyName'
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId)
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
      .populate({
        path: 'adminId',
        select: 'name email'
      });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }
    
    // Verify permissions
    if (req.user.role !== 'admin' && transaction.supplierId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    return res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update transaction status
export const updateTransactionStatus = async (req, res) => {
  try {
    // Verify admin permissions (only admins can update transaction status)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }
    
    const { transactionId } = req.params;
    const { status, paymentReference, notes } = req.body;
    
    // Validate status
    if (!status || !["pending", "processing", "paid", "completed", "cancelled", "refunded"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    
    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }
    
    // Update transaction
    transaction.status = status;
    
    if (paymentReference) {
      transaction.paymentReference = paymentReference;
    }
    
    if (notes) {
      transaction.notes = notes;
    }
    
    // Update date fields based on status
    if (status === 'paid' && !transaction.paymentDate) {
      transaction.paymentDate = new Date();
    }
    
    if (status === 'completed' && !transaction.completedDate) {
      transaction.completedDate = new Date();
    }
    
    await transaction.save();
    
    return res.status(200).json({
      success: true,
      message: "Transaction status updated",
      transaction
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};