import express from 'express';
import { 
  getSupplierProducts, 
  createProduct, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getAllProducts 
} from '../controllers/productController.js';
import userAuth from '../middleware/userAuth.js';

const productRouter = express.Router();

// Protect all routes with authentication
productRouter.use(userAuth);

// Routes
productRouter.get('/supplier', getSupplierProducts); 
productRouter.get('/all', getAllProducts);  // Get all products for the logged-in supplier
productRouter.post('/', createProduct);               // Create a new product
productRouter.get('/:productId', getProductById);     // Get a single product
productRouter.put('/:productId', updateProduct);      // Update a product
productRouter.delete('/:productId', deleteProduct);   // Delete a product

export default productRouter;