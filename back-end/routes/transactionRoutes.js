import express from 'express';
import {
  createTransaction,
  getSupplierTransactions,
  getAdminTransactions,
  getTransactionById,
  updateTransactionStatus
} from '../controllers/transactionController.js';
import userAuth from '../middleware/userAuth.js';

const transactionRouter = express.Router();

// Protect all routes with authentication
transactionRouter.use(userAuth);

// Routes
transactionRouter.post('/', createTransaction);                    // Create a new transaction (admin only)
transactionRouter.get('/supplier', getSupplierTransactions);       // Get supplier's transactions
transactionRouter.get('/admin', getAdminTransactions);             // Get all transactions (admin only)
transactionRouter.get('/:transactionId', getTransactionById);      // Get a single transaction
transactionRouter.put('/:transactionId/status', updateTransactionStatus); // Update transaction status (admin only)

export default transactionRouter;