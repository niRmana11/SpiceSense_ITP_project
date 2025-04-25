import express from 'express';
import { 
  createOrderDelivery, 
  getSupplierOrderDeliveries, 
  getAdminOrderDeliveries, 
  getOrderDeliveryById, 
  updateOrderDeliveryStatus 
} from '../controllers/orderDeliveryController.js';
import userAuth from '../middleware/userAuth.js';

const orderDeliveryRouter = express.Router();

// Protect all routes with authentication
orderDeliveryRouter.use(userAuth);

// Routes
orderDeliveryRouter.post('/message/:messageId', createOrderDelivery);  // Create order from an approved message
orderDeliveryRouter.get('/supplier', getSupplierOrderDeliveries);     // Get all orders for a supplier
orderDeliveryRouter.get('/admin', getAdminOrderDeliveries);           // Get all orders for admin
orderDeliveryRouter.get('/:orderId', getOrderDeliveryById);           // Get a single order
orderDeliveryRouter.put('/:orderId/status', updateOrderDeliveryStatus); // Update order status

export default orderDeliveryRouter;