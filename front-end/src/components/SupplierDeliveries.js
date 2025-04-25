import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/SupplierDeliveries.css";

const SupplierDeliveries = () => {
  const [shipments, setShipments] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeShipment, setActiveShipment] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    trackingNumber: "",
    carrier: "",
    deliveryNotes: "",
    actualDeliveryDate: ""
  });
  
  const [createFormData, setCreateFormData] = useState({
    orderDeliveryId: "",
    trackingNumber: "",
    carrier: "",
    expectedDeliveryDate: "",
    deliveryNotes: ""
  });
  
  useEffect(() => {
    fetchShipments();
    fetchReadyOrders();
  }, [statusFilter]);
  
  const fetchShipments = async () => {
    try {
      setLoading(true);
      
      let url = "http://localhost:5000/api/deliveries/supplier";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      
      const response = await axios.get(url, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        setShipments(response.data.shipments || []);
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
      setError("Failed to load shipments. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchReadyOrders = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/orderdelivers/supplier?status=ready_for_shipment",
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Filter out orders that already have shipments
        const orderIds = new Set(shipments.map(shipment => 
          shipment.orderDeliveryId?._id || shipment.orderDeliveryId
        ));
        
        const filteredOrders = response.data.orders.filter(
          order => !orderIds.has(order._id)
        );
        
        setReadyOrders(filteredOrders);
      }
    } catch (error) {
      console.error("Error fetching ready orders:", error);
    }
  };
  
  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData({
      ...updateFormData,
      [name]: value
    });
  };
  
  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: value
    });
  };
  
  const handleOpenUpdateModal = (shipment) => {
    setActiveShipment(shipment);
    setUpdateFormData({
      status: "",
      trackingNumber: shipment.trackingNumber || "",
      carrier: shipment.carrier || "",
      deliveryNotes: shipment.deliveryNotes || "",
      actualDeliveryDate: ""
    });
    setShowUpdateModal(true);
  };
  
  const handleOpenCreateModal = () => {
    if (readyOrders.length === 0) {
      setError("No orders ready for shipment.");
      return;
    }
    
    setCreateFormData({
      orderDeliveryId: readyOrders[0]._id,
      trackingNumber: "",
      carrier: "",
      expectedDeliveryDate: "",
      deliveryNotes: ""
    });
    
    setShowCreateModal(true);
  };
  
  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setActiveShipment(null);
  };
  
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };
  
  const handleCreateShipment = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/deliveries",
        createFormData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        fetchShipments();
        fetchReadyOrders();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      setError("Failed to create shipment. " + (error.response?.data?.message || "Please try again."));
    }
  };
  
  const handleUpdateShipment = async (e) => {
    e.preventDefault();
    
    if (!activeShipment) return;
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/deliveries/${activeShipment._id}/status`,
        updateFormData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setShipments(shipments.map(shipment => 
          shipment._id === activeShipment._id ? response.data.shipment : shipment
        ));
        setShowUpdateModal(false);
        setActiveShipment(null);
      }
    } catch (error) {
      console.error("Error updating shipment:", error);
      setError("Failed to update shipment. " + (error.response?.data?.message || "Please try again."));
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case "preparing": return "Preparing";
      case "shipped": return "Shipped";
      case "in_transit": return "In Transit";
      case "out_for_delivery": return "Out for Delivery";
      case "delivered": return "Delivered";
      case "failed_delivery": return "Failed Delivery";
      default: return status;
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case "preparing": return "sd-status-preparing";
      case "shipped": return "sd-status-shipped";
      case "in_transit": return "sd-status-transit";
      case "out_for_delivery": return "sd-status-out";
      case "delivered": return "sd-status-delivered";
      case "failed_delivery": return "sd-status-failed";
      default: return "sd-status-default";
    }
  };
  
  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case "preparing":
        return [
          { value: "shipped", label: "Mark as Shipped" }
        ];
      case "shipped":
        return [
          { value: "in_transit", label: "Mark as In Transit" },
          { value: "delivered", label: "Mark as Delivered" }
        ];
      case "in_transit":
        return [
          { value: "out_for_delivery", label: "Mark as Out for Delivery" },
          { value: "delivered", label: "Mark as Delivered" },
          { value: "failed_delivery", label: "Mark as Failed Delivery" }
        ];
      case "out_for_delivery":
        return [
          { value: "delivered", label: "Mark as Delivered" },
          { value: "failed_delivery", label: "Mark as Failed Delivery" }
        ];
      case "failed_delivery":
        return [
          { value: "in_transit", label: "Mark as In Transit Again" },
          { value: "out_for_delivery", label: "Reschedule Delivery" },
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
      <div className="sd-loading-container">
        <div className="sd-spinner"></div>
        <p>Loading deliveries...</p>
      </div>
    );
  }

  return (
    <div className="sd-container">
      <div className="sd-card">
        <div className="sd-header">
          <h2 className="sd-title">Shipment & Delivery Management</h2>
          <button
            onClick={handleOpenCreateModal}
            className="sd-create-btn"
            disabled={readyOrders.length === 0}
          >
            Create New Shipment
          </button>
        </div>
        
        {error && (
          <div className="sd-error">
            {error}
          </div>
        )}
        
        {/* Status filter */}
        <div className="sd-filter">
          <label className="sd-label">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sd-select"
          >
            <option value="all">All Shipments</option>
            <option value="preparing">Preparing</option>
            <option value="shipped">Shipped</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed_delivery">Failed Delivery</option>
          </select>
        </div>
        
        {/* Shipments list */}
        {shipments.length === 0 ? (
          <div className="sd-empty">
            <p>No shipments found.</p>
            {readyOrders.length > 0 && (
              <p>You have orders ready for shipment. Click "Create New Shipment" to continue.</p>
            )}
          </div>
        ) : (
          <div className="sd-shipments">
            {shipments.map((shipment) => (
              <div key={shipment._id} className="sd-shipment-card">
                <div className="sd-shipment-header">
                  <div>
                    <h4 className="sd-shipment-title">
                      {shipment.orderDeliveryId?.productId?.productName || "Product Unavailable"}
                    </h4>
                    <p className="sd-shipment-subtext">
                      Order #{shipment.orderDeliveryId?._id?.substring(0, 8) || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className={`sd-status ${getStatusClass(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                  </div>
                </div>
                
                <div className="sd-shipment-details">
                  <div className="sd-shipment-info-grid">
                    <div className="sd-shipment-info-group">
                      <p className="sd-shipment-label">Quantity:</p>
                      <p className="sd-shipment-value">{shipment.orderDeliveryId?.quantity || "N/A"}</p>
                    </div>
                    <div className="sd-shipment-info-group">
                      <p className="sd-shipment-label">Total Value:</p>
                      <p className="sd-shipment-value">
                        Rs{shipment.orderDeliveryId?.totalAmount?.toFixed(2) || "N/A"}
                      </p>
                    </div>
                    <div className="sd-shipment-info-group">
                      <p className="sd-shipment-label">Carrier:</p>
                      <p className="sd-shipment-value">{shipment.carrier || "Not specified"}</p>
                    </div>
                    <div className="sd-shipment-info-group">
                      <p className="sd-shipment-label">Tracking #:</p>
                      <p className="sd-shipment-value">{shipment.trackingNumber || "Not provided"}</p>
                    </div>
                    <div className="sd-shipment-info-group">
                      <p className="sd-shipment-label">Created:</p>
                      <p className="sd-shipment-value">{formatDateTime(shipment.createdAt)}</p>
                    </div>
                    <div className="sd-shipment-info-group">
                      <p className="sd-shipment-label">Expected Delivery:</p>
                      <p className="sd-shipment-value">{formatDate(shipment.expectedDeliveryDate)}</p>
                    </div>
                    {shipment.status === "delivered" && (
                      <div className="sd-shipment-info-group">
                        <p className="sd-shipment-label">Delivered On:</p>
                        <p className="sd-shipment-value">
                          {formatDateTime(shipment.actualDeliveryDate)}
                        </p>
                      </div>
                    )}
                    <div className="sd-shipment-info-group">
                      <p className="sd-shipment-label">Last Updated:</p>
                      <p className="sd-shipment-value">{formatDateTime(shipment.lastUpdated)}</p>
                    </div>
                  </div>
                  
                  {shipment.deliveryNotes && (
                    <div className="sd-shipment-notes">
                      <p className="sd-shipment-label">Delivery Notes:</p>
                      <p className="sd-shipment-value">{shipment.deliveryNotes}</p>
                    </div>
                  )}
                </div>
                
                {shipment.status !== "delivered" && (
                  <div className="sd-shipment-actions">
                    <button
                      onClick={() => handleOpenUpdateModal(shipment)}
                      className="sd-update-btn"
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
      
      {/* Create shipment modal */}
      {showCreateModal && (
        <div className="sd-modal">
          <div className="sd-modal-content">
            <h3 className="sd-modal-title">
              Create New Shipment
            </h3>
            
            <form onSubmit={handleCreateShipment}>
              <div className="sd-form-group">
                <label className="sd-label">Select Order *</label>
                <select
                  name="orderDeliveryId"
                  value={createFormData.orderDeliveryId}
                  onChange={handleCreateInputChange}
                  required
                  className="sd-input"
                >
                  <option value="">Select an order</option>
                  {readyOrders.map(order => (
                    <option key={order._id} value={order._id}>
                      {order.productId?.productName} - Qty: {order.quantity}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sd-form-group">
                <label className="sd-label">Carrier</label>
                <input
                  type="text"
                  name="carrier"
                  value={createFormData.carrier}
                  onChange={handleCreateInputChange}
                  placeholder="Enter carrier name (e.g. DHL, FedEx)"
                  className="sd-input"
                />
              </div>
              
              <div className="sd-form-group">
                <label className="sd-label">Tracking Number</label>
                <input
                  type="text"
                  name="trackingNumber"
                  value={createFormData.trackingNumber}
                  onChange={handleCreateInputChange}
                  placeholder="Enter tracking number"
                  className="sd-input"
                />
              </div>
              
              <div className="sd-form-group">
                <label className="sd-label">Expected Delivery Date *</label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={createFormData.expectedDeliveryDate}
                  onChange={handleCreateInputChange}
                  required
                  className="sd-input"
                />
              </div>
              
              <div className="sd-form-group">
                <label className="sd-label">Delivery Notes</label>
                <textarea
                  name="deliveryNotes"
                  value={createFormData.deliveryNotes}
                  onChange={handleCreateInputChange}
                  placeholder="Enter any special instructions or notes"
                  rows="3"
                  className="sd-textarea"
                ></textarea>
              </div>
              
              <div className="sd-modal-buttons">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="sd-button sd-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sd-button sd-button-submit"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Update shipment modal */}
      {showUpdateModal && activeShipment && (
        <div className="sd-modal">
          <div className="sd-modal-content">
            <h3 className="sd-modal-title">
              Update Shipment Status
            </h3>
            
            <div className="sd-modal-info">
              <p className="sd-modal-product">
                {activeShipment.orderDeliveryId?.productId?.productName || "Product"}
              </p>
              <p className="sd-modal-status">
                Current Status: <span className={getStatusClass(activeShipment.status)}>
                  {getStatusLabel(activeShipment.status)}
                </span>
              </p>
            </div>
            
            <form onSubmit={handleUpdateShipment}>
              <div className="sd-form-group">
                <label className="sd-label">New Status *</label>
                <select
                  name="status"
                  value={updateFormData.status}
                  onChange={handleUpdateInputChange}
                  required
                  className="sd-input"
                >
                  <option value="">Select new status</option>
                  {getNextStatusOptions(activeShipment.status).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sd-form-group">
                <label className="sd-label">Tracking Number</label>
                <input
                  type="text"
                  name="trackingNumber"
                  value={updateFormData.trackingNumber}
                  onChange={handleUpdateInputChange}
                  className="sd-input"
                />
              </div>
              
              <div className="sd-form-group">
                <label className="sd-label">Carrier</label>
                <input
                  type="text"
                  name="carrier"
                  value={updateFormData.carrier}
                  onChange={handleUpdateInputChange}
                  className="sd-input"
                />
              </div>
              
              {updateFormData.status === "delivered" && (
                <div className="sd-form-group">
                  <label className="sd-label">Actual Delivery Date *</label>
                  <input
                    type="date"
                    name="actualDeliveryDate"
                    value={updateFormData.actualDeliveryDate}
                    onChange={handleUpdateInputChange}
                    required={updateFormData.status === "delivered"}
                    className="sd-input"
                  />
                </div>
              )}
              
              <div className="sd-form-group">
                <label className="sd-label">Delivery Notes</label>
                <textarea
                  name="deliveryNotes"
                  value={updateFormData.deliveryNotes}
                  onChange={handleUpdateInputChange}
                  rows="3"
                  className="sd-textarea"
                ></textarea>
              </div>
              
              <div className="sd-modal-buttons">
                <button
                  type="button"
                  onClick={handleCloseUpdateModal}
                  className="sd-button sd-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sd-button sd-button-submit"
                >
                  Update Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDeliveries;