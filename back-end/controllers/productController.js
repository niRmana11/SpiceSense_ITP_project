import ProductSupplier from "../models/productModel.js";
import User from "../models/userModel.js"; 


export const getSupplierProducts = async (req, res) => {
  try {
    
    const supplierId = req.user.id;

    
    const products = await ProductSupplier.find({ 
      supplierId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error("Error fetching supplier products:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const createProduct = async (req, res) => {
  try {
    const { productName, productCategory, price, stockQuantity, minimumOrderQuantity } = req.body;
    
    
    if (!productName || !productCategory || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    
    const newProduct = new ProductSupplier({
      productName,
      productCategory,
      price: Number(price),
      stockQuantity: Number(stockQuantity || 0),
      minimumOrderQuantity: Number(minimumOrderQuantity || 1),
      supplierId: req.user.id,
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct
    });
  } catch (error) {
    console.error("Error creating product:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await ProductSupplier.findById(productId);
    
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    
    if (product.supplierId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    
    
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stockQuantity) updateData.stockQuantity = Number(updateData.stockQuantity);
    if (updateData.minimumOrderQuantity) updateData.minimumOrderQuantity = Number(updateData.minimumOrderQuantity);
    
    
    const product = await ProductSupplier.findById(productId);
    
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    
    if (product.supplierId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    
    const updatedProduct = await ProductSupplier.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    
    const product = await ProductSupplier.findById(productId);
    
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    
    if (product.supplierId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    
    
    product.isActive = false;
    await product.save();
    
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    
    const products = await ProductSupplier.find({ 
      isActive: true 
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};