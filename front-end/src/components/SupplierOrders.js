import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/SupplierOrders.css";

const SupplierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeOrder, setActiveOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    orderStatus: "",
    trackingInfo: "",
    deliveryNotes: "",
    expectedDeliveryDate: ""
  });
  
  useEffect(() => {
    fetchOrders();
    fetchApprovedMessages();
  }, [statusFilter]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let url = "http://localhost:5000/api/orderdelivers/supplier";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      
      const response = await axios.get(url, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchApprovedMessages = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/messages/supplier?status=approved",
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Filter out messages that already have orders
        const messageIds = new Set(orders.map(order => order.messageId?._id || order.messageId));
        const filteredMessages = response.data.messages.filter(
          message => !messageIds.has(message._id)
        );
        setMessages(filteredMessages);
      }
    } catch (error) {
      console.error("Error fetching approved messages:", error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCreateOrderFromMessage = async (messageId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/orderdelivers/message/${messageId}`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        fetchOrders();
        fetchApprovedMessages();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setError("Failed to create order. " + (error.response?.data?.message || "Please try again."));
    }
  };
  
  const handleOpenUpdateModal = (order) => {
    setActiveOrder(order);
    setFormData({
      orderStatus: "",
      trackingInfo: order.trackingInfo || "",
      deliveryNotes: order.deliveryNotes || "",
      expectedDeliveryDate: order.expectedDeliveryDate 
        ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
        : ""
    });
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setActiveOrder(null);
  };
  
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    
    if (!activeOrder) return;
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/orderdelivers/${activeOrder._id}/status`,
        formData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setOrders(orders.map(order => 
          order._id === activeOrder._id ? response.data.order : order
        ));
        setShowModal(false);
        setActiveOrder(null);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order. " + (error.response?.data?.message || "Please try again."));
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case "approved": return "Approved";
      case "ready_for_shipment": return "Ready for Shipment";
      case "shipped": return "Shipped";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case "approved": return "so-status-approved";
      case "ready_for_shipment": return "so-status-ready";
      case "shipped": return "so-status-shipped";
      case "delivered": return "so-status-delivered";
      case "cancelled": return "so-status-cancelled";
      default: return "so-status-default";
    }
  };
  
  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case "approved":
        return [
          { value: "ready_for_shipment", label: "Mark as Ready for Shipment" },
          { value: "cancelled", label: "Cancel Order" }
        ];
      case "ready_for_shipment":
        return [
          { value: "shipped", label: "Mark as Shipped" },
          { value: "cancelled", label: "Cancel Order" }
        ];
      case "shipped":
        return [
          { value: "delivered", label: "Mark as Delivered" }
        ];
      default:
        return [];
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";
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
      <div className="so-loading-container">
        <div className="so-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="so-container">
      <div className="so-card">
        <h2 className="so-title">Order Management</h2>
        
        {error && (
          <div className="so-error">
            {error}
          </div>
        )}
        
        {/* Status filter */}
        <div className="so-filter">
          <label className="so-label">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="so-select"
          >
            <option value="all">All Orders</option>
            <option value="approved">Approved</option>
            <option value="ready_for_shipment">Ready for Shipment</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        {/* Approved messages that can be converted to orders */}
        {messages.length > 0 && (
          <div className="so-approved-messages">
            <h3 className="so-section-title">Approved Requests to Process</h3>
            <div className="so-message-list">
              {messages.map((message) => (
                <div key={message._id} className="so-message-card">
                  <div className="so-message-header">
                    <h4 className="so-message-title">
                      {message.productId?.productName || "Product Unavailable"}
                    </h4>
                    <span className="so-message-badge">Approved Request</span>
                  </div>
                  <div className="so-message-details">
                    <p className="so-message-text">
                      <span className="so-bold">Approved Quantity:</span> {message.approvedQuantity}
                    </p>
                    <p className="so-message-text">
                      <span className="so-bold">Approved Price:</span> Rs{message.approvedPrice}
                    </p>
                    <p className="so-message-text">
                      <span className="so-bold">Total Value:</span> Rs{(message.approvedQuantity * message.approvedPrice).toFixed(2)}
                    </p>
                    <p className="so-message-text">
                      <span className="so-bold">Date Approved:</span> {formatDateTime(message.updatedAt)}
                    </p>
                  </div>
                  <div className="so-message-action">
                    <button
                      onClick={() => handleCreateOrderFromMessage(message._id)}
                      className="so-create-order-btn"
                    >
                      Process as Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="so-empty">
            <p>No orders found.</p>
            {messages.length > 0 && (
              <p>You have approved requests that can be processed as orders.</p>
            )}
          </div>
        ) : (
          <div className="so-orders">
            <h3 className="so-section-title">Current Orders</h3>
            {orders.map((order) => (
              <div key={order._id} className="so-order-card">
                <div className="so-order-header">
                  <div>
                    <h4 className="so-order-title">
                      {order.productId?.productName || "Product Unavailable"}
                    </h4>
                    <p className="so-order-subtext">
                      Category: {order.productId?.productCategory || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className={`so-status ${getStatusClass(order.orderStatus)}`}>
                      {getStatusLabel(order.orderStatus)}
                    </span>
                  </div>
                </div>
                
                <div className="so-order-details">
                  <div className="so-order-info-grid">
                    <div className="so-order-info-group">
                      <p className="so-order-label">Quantity:</p>
                      <p className="so-order-value">{order.quantity}</p>
                    </div>
                    <div className="so-order-info-group">
                      <p className="so-order-label">Price:</p>
                      <p className="so-order-value">Rs{order.price}</p>
                    </div>
                    <div className="so-order-info-group">
                      <p className="so-order-label">Total Amount:</p>
                      <p className="so-order-value">Rs{order.totalAmount}</p>
                    </div>
                    <div className="so-order-info-group">
                      <p className="so-order-label">Order Date:</p>
                      <p className="so-order-value">{formatDateTime(order.createdAt)}</p>
                    </div>
                    {order.readyDate && (
                      <div className="so-order-info-group">
                        <p className="so-order-label">Ready Date:</p>
                        <p className="so-order-value">{formatDateTime(order.readyDate)}</p>
                      </div>
                    )}
                    {order.expectedDeliveryDate && (
                      <div className="so-order-info-group">
                        <p className="so-order-label">Expected Delivery:</p>
                        <p className="so-order-value">{formatDate(order.expectedDeliveryDate)}</p>
                      </div>
                    )}
                    {order.actualDeliveryDate && (
                      <div className="so-order-info-group">
                        <p className="so-order-label">Actual Delivery:</p>
                        <p className="so-order-value">{formatDateTime(order.actualDeliveryDate)}</p>
                      </div>
                    )}
                  </div>
                  
                  {order.trackingInfo && (
                    <div className="so-order-tracking">
                      <p className="so-order-label">Tracking Information:</p>
                      <p className="so-order-value">{order.trackingInfo}</p>
                    </div>
                  )}
                  
                  {order.deliveryNotes && (
                    <div className="so-order-notes">
                      <p className="so-order-label">Delivery Notes:</p>
                      <p className="so-order-value">{order.deliveryNotes}</p>
                    </div>
                  )}
                </div>
                
                {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                  <div className="so-order-actions">
                    <button
                      onClick={() => handleOpenUpdateModal(order)}
                      className="so-update-btn"
                    >
                      Update Status
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Update order modal */}
      {showModal && activeOrder && (
        <div className="so-modal">
          <div className="so-modal-content">
            <h3 className="so-modal-title">
              Update Order Status
            </h3>
            
            <div className="so-modal-info">
              <p className="so-modal-product">{activeOrder.productId?.productName}</p>
              <p className="so-modal-status">
                Current Status: <span className={getStatusClass(activeOrder.orderStatus)}>
                  {getStatusLabel(activeOrder.orderStatus)}
                </span>
              </p>
            </div>
            
            <form onSubmit={handleUpdateOrder}>
              <div className="so-form-group">
                <label className="so-label">New Status *</label>
                <select
                  name="orderStatus"
                  value={formData.orderStatus}
                  onChange={handleInputChange}
                  required
                  className="so-input"
                >
                  <option value="">Select new status</option>
                  {getNextStatusOptions(activeOrder.orderStatus).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {(formData.orderStatus === "ready_for_shipment" || 
                formData.orderStatus === "shipped") && (
                <>
                  <div className="so-form-group">
                    <label className="so-label">Tracking Information</label>
                    <input
                      type="text"
                      name="trackingInfo"
                      value={formData.trackingInfo}
                      onChange={handleInputChange}
                      placeholder="Enter tracking number or information"
                      className="so-input"
                    />
                  </div>
                  
                  {formData.orderStatus === "shipped" && (
                    <div className="so-form-group">
                      <label className="so-label">Expected Delivery Date *</label>
                      <input
                        type="date"
                        name="expectedDeliveryDate"
                        value={formData.expectedDeliveryDate}
                        onChange={handleInputChange}
                        required={formData.orderStatus === "shipped"}
                        className="so-input"
                      />
                    </div>
                  )}
                  
                  <div className="so-form-group">
                    <label className="so-label">Delivery Notes</label>
                    <textarea
                      name="deliveryNotes"
                      value={formData.deliveryNotes}
                      onChange={handleInputChange}
                      placeholder="Enter any special instructions or notes"
                      rows="3"
                      className="so-textarea"
                    ></textarea>
                  </div>
                </>
              )}
              
              <div className="so-modal-buttons">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="so-button so-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="so-button so-button-submit"
                >
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOrders;