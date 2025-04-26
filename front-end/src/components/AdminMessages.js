import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/AdminMessages.css";

const AdminMessages = () => {
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productLoading, setProductLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        console.log("Fetching products...");
        const productsResponse = await axios.get("http://localhost:5000/api/supProducts/all", {
          withCredentials: true,
        });

        console.log("Products response:", productsResponse.data);

        if (productsResponse.data.success) {
          const formattedProducts = productsResponse.data.products.map(product => ({
            _id: product._id?.$oid || product._id,
            productName: product.productName || "Unnamed Product",
            productCategory: product.productCategory || "No Category",
            price: parseFloat(product.price?.$numberDouble) || parseFloat(product.price) || 0,
            stockQuantity: parseInt(product.stockQuantity?.$numberInt) || parseInt(product.stockQuantity) || 0,
            minimumOrderQuantity: parseInt(product.minimumOrderQuantity?.$numberInt) || parseInt(product.minimumOrderQuantity) || 1,
            supplierId: product.supplierId?.$oid || product.supplierId
          }));

          console.log("Formatted products:", formattedProducts);
          setProducts(formattedProducts);
          setDebugInfo(`Loaded ${formattedProducts.length} products`);
        } else {
          setError("Failed to load products: " + (productsResponse.data.message || "Unknown error"));
        }

        const messagesResponse = await axios.get("http://localhost:5000/api/messages/admin", {
          withCredentials: true,
        });

        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.messages);
        } else {
          console.warn("Messages not loaded:", messagesResponse.data.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(`Failed to load data: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    statusFilter === "all" || message.status === statusFilter
  );

  const handleCreateMessage = async (e) => {
    e.preventDefault();

    if (!selectedProduct || !requestedQuantity || requestedQuantity < 1) {
      setError("Please select a product and enter a valid quantity");
      return;
    }

    try {
      setProductLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/messages",
        {
          productId: selectedProduct,
          requestedQuantity: Number(requestedQuantity)
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const messagesResponse = await axios.get("http://localhost:5000/api/messages/admin", {
          withCredentials: true,
        });

        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.messages);
        }

        setSelectedProduct("");
        setRequestedQuantity("");
        setShowCreateForm(false);
        setError(null);
      }
    } catch (error) {
      console.error("Error creating message:", error);
      setError("Failed to send request: " + (error.response?.data?.message || error.message));
    } finally {
      setProductLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "am-status-pending";
      case "approved":
        return "am-status-approved";
      case "rejected":
        return "am-status-rejected";
      default:
        return "am-status-default";
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="am-loading-container">
        <div className="am-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="am-container">
      <div className="am-card">
        <div className="am-header">
          <h2 className="am-title">Supplier Communications</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="am-button am-button-primary"
          >
            {showCreateForm ? "Cancel" : "New Request"}
          </button>
        </div>

        {error && (
          <div className="am-error">
            {error}
          </div>
        )}

        {debugInfo && (
          <div className="am-debug">
            {debugInfo}
          </div>
        )}

        {showCreateForm && (
          <div className="am-form-container">
            <h3 className="am-form-title">Send Product Request to Supplier</h3>
            <form onSubmit={handleCreateMessage} className="am-form">
              <div className="am-form-group">
                <label className="am-label">Select Product *</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                  className="am-select"
                >
                  <option value="">Select a product</option>
                  {filteredProducts && filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.productName} - {product.productCategory} (Rs{product.price.toFixed(2)})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No products available</option>
                  )}
                </select>
                {filteredProducts.length === 0 && searchTerm && (
                  <p className="am-error-text">No products match your search. Try a different term.</p>
                )}
              </div>

              <div className="am-form-group">
                <label className="am-label">Request Quantity *</label>
                <input
                  type="number"
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(e.target.value)}
                  min="1"
                  required
                  className="am-input"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={productLoading}
                  className={`am-button ${productLoading ? "am-button-disabled" : "am-button-primary"}`}
                >
                  {productLoading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="am-filter">
          <label className="am-label">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="am-select"
          >
            <option value="all">All Messages</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="am-empty">
            <p>No messages found.</p>
          </div>
        ) : (
          <div className="am-messages">
            {filteredMessages.map((message) => (
              <div
                key={message._id}
                className={`am-message ${message.seen ? "am-message-seen" : "am-message-unseen"}`}
              >
                <div className="am-message-header">
                  <div>
                    <h3 className="am-message-title">
                      {message.productId?.productName || "Product Unavailable"}
                    </h3>
                    <p className="am-message-subtext">
                      Category: {message.productId?.productCategory || "N/A"} |
                      Original Price: Rs{message.productId?.price || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className={`am-status ${getStatusClass(message.status)}`}>
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="am-message-body">
                  <div>
                    <p className="am-message-text">
                      <span className="am-bold">Supplier:</span> {message.supplierId?.name || "Unknown"}
                      {message.supplierId?.companyName && ` (${message.supplierId.companyName})`}
                    </p>
                    <p className="am-message-text">
                      <span className="am-bold">Requested Qty:</span> {message.requestedQuantity}
                    </p>
                  </div>
                  <div className="am-message-date">
                    {formatDate(message.createdAt)}
                  </div>
                </div>

                {message.status !== "pending" && (
                  <div className="am-message-footer">
                    {message.status === "approved" ? (
                      <div className="am-approved">
                        <p className="am-message-text">
                          <span className="am-bold">Approved Quantity:</span> {message.approvedQuantity}
                        </p>
                        <p className="am-message-text">
                          <span className="am-bold">Approved Price:</span> Rs{message.approvedPrice}
                        </p>
                        <p className="am-message-text">
                          <span className="am-bold">Total Value:</span> Rs{(message.approvedQuantity * message.approvedPrice).toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div className="am-rejected">
                        <p className="am-message-text">
                          <span className="am-bold">Rejection Reason:</span> {message.rejectReason || "No reason provided"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!message.seen && (
                  <div className="am-new-response">
                    <span className="am-new-badge">New Response</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;