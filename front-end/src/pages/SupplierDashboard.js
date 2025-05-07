import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import SupplierMessages from "../components/SupplierMessages";
import SupplierOrders from "../components/SupplierOrders";
import SupplierDeliveries from "../components/SupplierDeliveries";
import SupplierTransactions from "../components/SupplierTransactions";
import "../Styles/SupplierDashboard.css";

const SupplierDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [availableProducts, setAvailableProducts] = useState([]);

  
  const productsByCategory = {
    "Whole Spices": ["Black Pepper", "Cardamom", "Cinnamon", "Cloves", "Cumin Seeds", "Fennel Seeds"],
    "Ground Spices": ["Ground Turmeric", "Ground Cumin", "Ground Coriander", "Ground Cinnamon", "Ground Cardamom"],
    "Blended Spices": ["Chilli Powder", "Curry Powder", "Ginger Powder", "Tandoori Masala", "Cinnamon Powder"],
    "Herbs": ["Basil", "Oregano", "Rosemary", "Thyme", "Mint", "Coriander Leaves"],
    "Seasoning Mixes": ["Italian Seasoning", "BBQ Rub", "Mexican Seasoning", "Cajun Spice Mix"],
    "Exotic Spices": ["Saffron", "Star Anise", "Vanilla Beans", "Sumac", "Za'atar"],
    "Organic Spices": ["Organic Turmeric", "Organic Ginger", "Organic Cinnamon", "Organic Cloves"]
  };

  const [formData, setFormData] = useState({
    productName: "",
    productCategory: "",
    price: "",
    stockQuantity: "",
    minimumOrderQuantity: ""
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const passedUserData = location.state?.userData;
        if (passedUserData) {
          setUserData(passedUserData);
          await fetchProducts();
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/user/data", {
          withCredentials: true,
        });

        if (response.data.success) {
          setUserData(response.data.userData);
          await fetchProducts();
        } else {
          setError(response.data.message);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load dashboard. Please log in again.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, location.state]);

  // Update available products when category changes
  useEffect(() => {
    if (formData.productCategory) {
      // Get products from the selected category
      const categoryProducts = productsByCategory[formData.productCategory] || [];

      // Filter out products that are already added
      const alreadyAddedProductNames = products
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

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/supProducts/supplier", {
        withCredentials: true,
      });

      if (response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      navigate("/welcome");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // If changing product category, reset product name
    if (name === "productCategory") {
      setFormData(prev => ({
        ...prev,
        productName: ""
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicate products
    const isDuplicate = products.some(product =>
      product.productName === formData.productName &&
      (editProduct ? product._id !== editProduct._id : true)
    );

    if (isDuplicate) {
      setError("You have already added this product. Please choose a different one.");
      return; // Prevent form submission
    }

    try {
      if (editProduct) {
        const response = await axios.put(
          `http://localhost:5000/api/supProducts/${editProduct._id}`,
          formData,
          { withCredentials: true }
        );

        if (response.data.success) {
          setProducts(products.map(p =>
            p._id === editProduct._id ? response.data.product : p
          ));
          resetForm();
        }
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/supProducts",
          formData,
          { withCredentials: true }
        );

        if (response.data.success) {
          setProducts([...products, response.data.product]);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      setError("Failed to save product. Please try again.");
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setFormData({
      productName: product.productName,
      productCategory: product.productCategory,
      price: product.price,
      stockQuantity: product.stockQuantity,
      minimumOrderQuantity: product.minimumOrderQuantity
    });
    setShowForm(true);
    setActiveTab("products");
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/api/supProducts/${productId}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setProducts(products.filter(p => p._id !== productId));
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        setError("Failed to delete product");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      productName: "",
      productCategory: "",
      price: "",
      stockQuantity: "",
      minimumOrderQuantity: ""
    });
    setEditProduct(null);
    setShowForm(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab !== "products") {
      setShowForm(false);
    }
  };

  if (loading) {
    return (
      <div className="sd-container">
        <div className="sd-loading">
          <h1 className="sd-loading-title">Loading...</h1>
          <div className="sd-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-container">
      <div className="sd-content">
        <div className="sd-header">
          <h1 className="sd-title">Supplier Dashboard</h1>
          <div className="sd-nav-buttons">
            <button
              onClick={() => switchTab("products")}
              className={`sd-tab-btn ${activeTab === "products" ? "sd-tab-active" : ""}`}
            >
              Products
            </button>
            <button
              onClick={() => switchTab("messages")}
              className={`sd-tab-btn ${activeTab === "messages" ? "sd-tab-active" : ""}`}
            >
              Requests
            </button>
            <button
              onClick={() => switchTab("orders")}
              className={`sd-tab-btn ${activeTab === "orders" ? "sd-tab-active" : ""}`}
            >
              Orders
            </button>
            <button
              onClick={() => switchTab("deliveries")}
              className={`sd-tab-btn ${activeTab === "deliveries" ? "sd-tab-active" : ""}`}
            >
              Deliveries
            </button>
            <button
              onClick={() => switchTab("transactions")}
              className={`sd-tab-btn ${activeTab === "transactions" ? "sd-tab-active" : ""}`}
            >
              Transactions
            </button>
            <button onClick={handleLogout} className="sd-logout-btn">
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="sd-error">
            {error}
          </div>
        )}

        <div className="sd-grid">
          <div className="sd-account-info">
            <h2 className="sd-section-title">Account Information</h2>
            {userData && (
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <p className="sd-info-label">Full Name</p>
                  <p className="sd-info-value">{userData.name}</p>
                </div>
                <div className="sd-info-item">
                  <p className="sd-info-label">Email</p>
                  <p className="sd-info-value">{userData.email}</p>
                </div>
                <div className="sd-info-item">
                  <p className="sd-info-label">Phone</p>
                  <p className="sd-info-value">{userData.phone || "Not provided"}</p>
                </div>
                <div className="sd-info-item">
                  <p className="sd-info-label">Company Name</p>
                  <p className="sd-info-value">{userData.companyName || "Not provided"}</p>
                </div>
                <div className="sd-info-item">
                  <p className="sd-info-label">Warehouse Location</p>
                  <p className="sd-info-value">{userData.contactPerson || "Not provided"}</p>
                </div>
                <div className="sd-info-item">
                  <p className="sd-info-label">Role</p>
                  <p className="sd-info-value">{userData.role}</p>
                </div>
              </div>
            )}
          </div>

          <div className="sd-main-content">
            {activeTab === "messages" ? (
              <SupplierMessages />
            ) : activeTab === "orders" ? (
              <SupplierOrders />
            ) : activeTab === "deliveries" ? (
              <SupplierDeliveries />
            ) : activeTab === "transactions" ? (
              <SupplierTransactions />
            ) : (
              <>
                <div className="sd-product-management">
                  <div className="sd-product-header">
                    <h2 className="sd-section-title">Product Management</h2>
                    {!showForm ? (
                      <button onClick={() => setShowForm(true)} className="sd-add-btn">
                        Add More Details
                      </button>
                    ) : (
                      <button onClick={resetForm} className="sd-cancel-btn">
                        Cancel
                      </button>
                    )}
                  </div>

                  {showForm && (
                    <form onSubmit={handleFormSubmit} className="sd-product-form">
                      <h3 className="sd-form-title">
                        {editProduct ? "Update Product" : "Add Product Details"}
                      </h3>
                      <div className="sd-form-grid">
                        <div className="sd-form-group">
                          <label className="sd-form-label">Product Category *</label>
                          <select
                            name="productCategory"
                            value={formData.productCategory}
                            onChange={handleInputChange}
                            required
                            className="sd-input"
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
                        </div>

                        <div className="sd-form-group">
                          <label className="sd-form-label">Product Name *</label>
                          {editProduct ? (
                            // If editing, show the product name as read-only
                            <input
                              type="text"
                              name="productName"
                              value={formData.productName}
                              className="sd-input"
                              readOnly
                            />
                          ) : (
                            // If adding new product, show dropdown based on category
                            formData.productCategory ? (
                              <select
                                name="productName"
                                value={formData.productName}
                                onChange={handleInputChange}
                                required
                                className="sd-input"
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
                                required
                                className="sd-input"
                                placeholder="First select a category"
                                disabled
                              />
                            )
                          )}
                        </div>

                        <div className="sd-form-group">
                          <label className="sd-form-label">Price (Rs) *</label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            required
                            className="sd-input"
                          />
                        </div>
                        <div className="sd-form-group">
                          <label className="sd-form-label">Stock Quantity *</label>
                          <input
                            type="number"
                            name="stockQuantity"
                            value={formData.stockQuantity}
                            onChange={handleInputChange}
                            min="0"
                            required
                            className="sd-input"
                          />
                        </div>
                        <div className="sd-form-group">
                          <label className="sd-form-label">Minimum Order Quantity *</label>
                          <input
                            type="number"
                            name="minimumOrderQuantity"
                            value={formData.minimumOrderQuantity}
                            onChange={handleInputChange}
                            min="1"
                            required
                            className="sd-input"
                          />
                        </div>
                      </div>
                      <div className="sd-form-actions">
                        <button type="submit" className="sd-submit-btn">
                          {editProduct ? "Update Product" : "Add Product"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="sd-products-list">
                  <h2 className="sd-section-title">Your Products</h2>
                  {products.length === 0 ? (
                    <div className="sd-empty-state">
                      <p className="sd-empty-text">You haven't added any products yet.</p>
                      <button onClick={() => setShowForm(true)} className="sd-add-btn">
                        Add Your First Product
                      </button>
                    </div>
                  ) : (
                    <div className="sd-table-container">
                      <table className="sd-table">
                        <thead className="sd-table-header">
                          <tr>
                            <th className="sd-table-th">Product Name</th>
                            <th className="sd-table-th">Category</th>
                            <th className="sd-table-th">Price</th>
                            <th className="sd-table-th">Stock</th>
                            <th className="sd-table-th">Min Order</th>
                            <th className="sd-table-th">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="sd-table-body">
                          {products.map((product) => (
                            <tr key={product._id} className="sd-table-row">
                              <td className="sd-table-td">{product.productName}</td>
                              <td className="sd-table-td">{product.productCategory}</td>
                              <td className="sd-table-td">Rs{product.price}</td>
                              <td className="sd-table-td">
                                <span
                                  className={`sd-stock-badge ${product.stockQuantity > 10
                                      ? "sd-stock-high"
                                      : product.stockQuantity > 0
                                        ? "sd-stock-low"
                                        : "sd-stock-out"
                                    }`}
                                >
                                  {product.stockQuantity}
                                </span>
                              </td>
                              <td className="sd-table-td">{product.minimumOrderQuantity}</td>
                              <td className="sd-table-td">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="sd-edit-btn"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(product._id)}
                                  className="sd-delete-btn"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;