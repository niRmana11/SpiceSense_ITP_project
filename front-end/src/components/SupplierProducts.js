import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/SupplierProducts.css"; // Import the separate CSS file

const SupplierProducts = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    productName: "",
    productCategory: "",
    price: "",
    stockQuantity: "",
    minimumOrderQuantity: ""
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Predefined product lists by category
  const [productsByCategory, setProductsByCategory] = useState({
    "Whole Spices": ["Black Pepper", "Cardamom", "Cinnamon", "Cloves", "Cumin Seeds", "Fennel Seeds"],
    "Ground Spices": ["Ground Turmeric", "Ground Cumin", "Ground Coriander", "Ground Cinnamon", "Ground Cardamom"],
    "Blended Spices": ["Garam Masala", "Curry Powder", "Chaat Masala", "Tandoori Masala", "Biryani Masala"],
    "Herbs": ["Basil", "Oregano", "Rosemary", "Thyme", "Mint", "Coriander Leaves"],
    "Seasoning Mixes": ["Italian Seasoning", "BBQ Rub", "Mexican Seasoning", "Cajun Spice Mix"],
    "Exotic Spices": ["Saffron", "Star Anise", "Vanilla Beans", "Sumac", "Za'atar"],
    "Organic Spices": ["Organic Turmeric", "Organic Ginger", "Organic Cinnamon", "Organic Cloves"]
  });
  
  // Available product options based on selected category
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const productsResponse = await axios.get("http://localhost:5000/api/products/all", {
          withCredentials: true,
        });

        const suppliersResponse = await axios.get("http://localhost:5000/api/user/role/supplier", {
          withCredentials: true,
        });

        if (productsResponse.data.success && suppliersResponse.data.success) {
          const productsWithSupplierNames = productsResponse.data.products.map(product => {
            const supplier = suppliersResponse.data.users.find(
              supplier => supplier._id === product.supplierId
            );
            return {
              ...product,
              supplierName: supplier ? supplier.name : "Unknown Supplier",
              companyName: supplier ? supplier.companyName : "Unknown Company"
            };
          });

          setProducts(productsWithSupplierNames);
          setSuppliers(suppliersResponse.data.users);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load supplier products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update available products when category changes
  useEffect(() => {
    if (formData.productCategory) {
      // Get products from the selected category
      const categoryProducts = productsByCategory[formData.productCategory] || [];
      
      // Filter out products that the current supplier has already added
      const currentSupplierProducts = products.filter(
        product => product.supplierId === getCurrentSupplierId()
      );
      
      const alreadyAddedProductNames = currentSupplierProducts
        .filter(product => product.productCategory === formData.productCategory)
        .map(product => product.productName);
      
      // Set available products, excluding already added ones
      const filteredProducts = categoryProducts.filter(
        product => !alreadyAddedProductNames.includes(product)
      );
      
      setAvailableProducts(filteredProducts);
    } else {
      setAvailableProducts([]);
    }
  }, [formData.productCategory, products]);

  // Helper function to get current supplier ID (you might need to replace this with actual logic)
  const getCurrentSupplierId = () => {
    // Replace this with how you determine the current supplier ID in your app
    // This might come from a user context, URL parameter, etc.
    return "current-supplier-id";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  
    setFormErrors({ ...formErrors, [name]: "" });
    
    // If changing product category, reset product name
    if (name === "productCategory") {
      setFormData(prev => ({
        ...prev,
        productName: ""
      }));
    }
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.productName.trim()) errors.productName = "Product name is required.";
    if (!formData.productCategory) errors.productCategory = "Please select a category.";
    if (!formData.price || formData.price <= 0) errors.price = "Price must be a positive number.";
    if (!formData.stockQuantity || formData.stockQuantity < 0) errors.stockQuantity = "Stock quantity cannot be negative.";
    if (!formData.minimumOrderQuantity || formData.minimumOrderQuantity < 1) errors.minimumOrderQuantity = "Minimum order must be at least 1.";

    // Check if product already exists for this supplier
    const isDuplicate = products.some(product => 
      product.supplierId === getCurrentSupplierId() && 
      product.productName === formData.productName &&
      (editingProduct ? product._id !== editingProduct._id : true)
    );
    
    if (isDuplicate) {
      errors.productName = "You have already added this product. Please choose a different one.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      productCategory: product.productCategory,
      price: product.price,
      stockQuantity: product.stockQuantity,
      minimumOrderQuantity: product.minimumOrderQuantity
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Stop if validation fails

    try {
      const response = await axios.put(
        `http://localhost:5000/api/products/${editingProduct._id}`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setProducts(products.map(product =>
          product._id === editingProduct._id
            ? {
                ...response.data.product,
                supplierName: product.supplierName,
                companyName: product.companyName
              }
            : product
        ));

        setShowEditForm(false);
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product. Please try again.");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Stop if validation fails

    try {
      const response = await axios.post(
        "http://localhost:5000/api/products",
        {
          ...formData,
          supplierId: getCurrentSupplierId() // Make sure to include the supplier ID
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Add the new product to the products array
        const newProduct = {
          ...response.data.product,
          supplierName: suppliers.find(s => s._id === getCurrentSupplierId())?.name || "Unknown",
          companyName: suppliers.find(s => s._id === getCurrentSupplierId())?.companyName || "Unknown"
        };
        
        setProducts([...products, newProduct]);
        
        // Reset form
        setFormData({
          productName: "",
          productCategory: "",
          price: "",
          stockQuantity: "",
          minimumOrderQuantity: ""
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setError("Failed to add product. Please try again.");
    }
  };

  return (
    <div className="supplier-container">
      <h2 className="supplier-title">Manage Products</h2>
      
      {/* Add Product Form */}
      <div className="supplier-add-form">
        <h3 className="supplier-form-title">Add New Product</h3>
        <form onSubmit={handleAddProduct} className="supplier-form-grid">
          <div className="supplier-form-group">
            <label className="supplier-label">
              Product Category *
            </label>
            <select
              name="productCategory"
              value={formData.productCategory}
              onChange={handleInputChange}
              className="supplier-select"
            >
              <option value="">Select Category</option>
              <option value="Whole Spices">Whole Spices</option>
              <option value="Ground Spices">Ground Spices</option>
              <option value="Blended Spices">Blended Spices</option>
              <option value="Herbs">Herbs</option>
              <option value="Seasoning Mixes">Seasoning Mixes</option>
              <option value="Exotic Spices">Exotic Spices</option>
              <option value="Organic Spices">Organic Spices</option>
            </select>
            {formErrors.productCategory && <p className="supplier-error">{formErrors.productCategory}</p>}
          </div>

          <div className="supplier-form-group">
            <label className="supplier-label">
              Product Name *
            </label>
            {formData.productCategory ? (
              <select
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="supplier-select"
              >
                <option value="">Select Product</option>
                {availableProducts.map((product, index) => (
                  <option key={index} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="supplier-input"
                placeholder="First select a category"
                disabled
              />
            )}
            {formErrors.productName && <p className="supplier-error">{formErrors.productName}</p>}
          </div>

          <div className="supplier-form-group">
            <label className="supplier-label">
              Price (Rs) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              className="supplier-input"
            />
            {formErrors.price && <p className="supplier-error">{formErrors.price}</p>}
          </div>

          <div className="supplier-form-group">
            <label className="supplier-label">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              min="0"
              className="supplier-input"
            />
            {formErrors.stockQuantity && <p className="supplier-error">{formErrors.stockQuantity}</p>}
          </div>

          <div className="supplier-form-group">
            <label className="supplier-label">
              Minimum Order Quantity *
            </label>
            <input
              type="number"
              name="minimumOrderQuantity"
              value={formData.minimumOrderQuantity}
              onChange={handleInputChange}
              min="1"
              className="supplier-input"
            />
            {formErrors.minimumOrderQuantity && <p className="supplier-error">{formErrors.minimumOrderQuantity}</p>}
          </div>

          <div className="supplier-form-actions">
            <button type="submit" className="supplier-add-button">Add Product</button>
          </div>
        </form>
      </div>
      
      {/* Edit Product Form */}
      {showEditForm && (
        <div className="supplier-edit-form">
          <h3 className="supplier-edit-title">Edit Product</h3>
          <form onSubmit={handleUpdate} className="supplier-form-grid">
            <div className="supplier-form-group">
              <label className="supplier-label">
                Product Category *
              </label>
              <select
                name="productCategory"
                value={formData.productCategory}
                onChange={handleInputChange}
                className="supplier-select"
              >
                <option value="">Select</option>
                <option value="Whole Spices">Whole Spices</option>
                <option value="Ground Spices">Ground Spices</option>
                <option value="Blended Spices">Blended Spices</option>
                <option value="Herbs">Herbs</option>
                <option value="Seasoning Mixes">Seasoning Mixes</option>
                <option value="Exotic Spices">Exotic Spices</option>
                <option value="Organic Spices">Organic Spices</option>
              </select>
              {formErrors.productCategory && <p className="supplier-error">{formErrors.productCategory}</p>}
            </div>

            <div className="supplier-form-group">
              <label className="supplier-label">
                Product Name *
              </label>
              {editingProduct ? (
                // When editing, just show the name (can't change it)
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  className="supplier-input"
                  disabled
                />
              ) : (
                // This shouldn't happen in edit mode, but just in case
                <select
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  className="supplier-select"
                  disabled={!formData.productCategory}
                >
                  <option value="">Select Product</option>
                  {availableProducts.map((product, index) => (
                    <option key={index} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              )}
              {formErrors.productName && <p className="supplier-error">{formErrors.productName}</p>}
            </div>

            <div className="supplier-form-group">
              <label className="supplier-label">
                Price (Rs) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                className="supplier-input"
              />
              {formErrors.price && <p className="supplier-error">{formErrors.price}</p>}
            </div>

            <div className="supplier-form-group">
              <label className="supplier-label">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                min="0"
                className="supplier-input"
              />
              {formErrors.stockQuantity && <p className="supplier-error">{formErrors.stockQuantity}</p>}
            </div>

            <div className="supplier-form-group">
              <label className="supplier-label">
                Minimum Order Quantity *
              </label>
              <input
                type="number"
                name="minimumOrderQuantity"
                value={formData.minimumOrderQuantity}
                onChange={handleInputChange}
                min="1"
                className="supplier-input"
              />
              {formErrors.minimumOrderQuantity && <p className="supplier-error">{formErrors.minimumOrderQuantity}</p>}
            </div>

            <div className="supplier-form-actions">
              <button type="submit" className="supplier-update-button">Update Product</button>
              <button 
                type="button" 
                className="supplier-cancel-button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingProduct(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Products List - You can add this if needed */}
      {/* Error display */}
      {error && <div className="supplier-error-message">{error}</div>}
      {loading && <div className="supplier-loading">Loading...</div>}
    </div>
  );
};

export default SupplierProducts;