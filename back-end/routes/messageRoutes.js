import express from 'express';
import { 
  createMessage, 
  getSupplierMessages, 
  getAdminMessages, 
  respondToMessage, 
  markMessageAsSeen 
} from '../controllers/messageController.js';
import userAuth from '../middleware/userAuth.js';

const messageRouter = express.Router();

// Protect all routes with authentication
messageRouter.use(userAuth);

// Routes
messageRouter.post('/', createMessage);                             // Admin creates a message
messageRouter.get('/supplier', getSupplierMessages);                // Supplier views their messages
messageRouter.get('/admin', getAdminMessages);                      // Admin views all messages with optional filters
messageRouter.put('/respond/:messageId', respondToMessage);         // Supplier responds to a message
messageRouter.put('/seen/:messageId', markMessageAsSeen);           // Mark message as seen

export default messageRouter;