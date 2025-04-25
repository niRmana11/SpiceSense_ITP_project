import express from 'express';
import { 
  createShipment, 
  getSupplierShipments, 
  getAdminShipments, 
  getShipmentById, 
  updateShipmentStatus 
} from '../controllers/shipmentDeliveryController.js';
import userAuth from '../middleware/userAuth.js';

const shipmentDeliveryRouter = express.Router();

// Protect all routes with authentication
shipmentDeliveryRouter.use(userAuth);

// Routes
shipmentDeliveryRouter.post('/', createShipment);                      // Create a new shipment
shipmentDeliveryRouter.get('/supplier', getSupplierShipments);         // Get all shipments for a supplier
shipmentDeliveryRouter.get('/admin', getAdminShipments);               // Get all shipments for admin
shipmentDeliveryRouter.get('/:shipmentId', getShipmentById);           // Get a single shipment
shipmentDeliveryRouter.put('/:shipmentId/status', updateShipmentStatus); // Update shipment status

export default shipmentDeliveryRouter;