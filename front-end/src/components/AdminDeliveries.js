import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/AdminDeliveries.css";

const AdminDeliveries = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    fetchShipments();
    fetchSuppliers();
  }, [statusFilter, supplierFilter]);
  
  const fetchShipments = async () => {
    try {
      setLoading(true);
      
      let url = "http://localhost:5000/api/deliveries/admin";
      const params = [];
      
      if (statusFilter !== "all") {
        params.push(`status=${statusFilter}`);
      }
      
      if (supplierFilter !== "all") {
        params.push(`supplierId=${supplierFilter}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
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
  
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/user/role/supplier", {
        withCredentials: true,
      });
      
      if (response.data.success) {
        setSuppliers(response.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
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
      case "preparing": return "ad-status-preparing";
      case "shipped": return "ad-status-shipped";
      case "in_transit": return "ad-status-transit";
      case "out_for_delivery": return "ad-status-out";
      case "delivered": return "ad-status-delivered";
      case "failed_delivery": return "ad-status-failed";
      default: return "ad-status-default";
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
  
  const filteredShipments = shipments.filter(shipment => {
    if (!searchTerm) return true;
    
    // Search by product name, supplier name, or tracking number
    const productName = shipment.orderDeliveryId?.productId?.productName?.toLowerCase() || "";
    const supplierName = shipment.orderDeliveryId?.supplierId?.name?.toLowerCase() || "";
    const companyName = shipment.orderDeliveryId?.supplierId?.companyName?.toLowerCase() || "";
    const trackingNumber = shipment.trackingNumber?.toLowerCase() || "";
    const carrier = shipment.carrier?.toLowerCase() || "";
    
    const term = searchTerm.toLowerCase();
    
    return productName.includes(term) || 
           supplierName.includes(term) || 
           companyName.includes(term) || 
           trackingNumber.includes(term) ||
           carrier.includes(term);
  });

  if (loading) {
    return (
      <div className="ad-loading-container">
        <div className="ad-spinner"></div>
        <p>Loading shipments...</p>
      </div>
    );
  }

  return (
    <div className="ad-container">
      <div className="ad-card">
        <h2 className="ad-title">Delivery Management</h2>
        
        {error && (
          <div className="ad-error">
            {error}
          </div>
        )}
        
        <div className="ad-filters">
          <div className="ad-filter-group">
            <label className="ad-label">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ad-select"
            >
              <option value="all">All Statuses</option>
              <option value="preparing">Preparing</option>
              <option value="shipped">Shipped</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed_delivery">Failed Delivery</option>
            </select>
          </div>
          
          <div className="ad-filter-group">
            <label className="ad-label">Supplier:</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="ad-select"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name} {supplier.companyName ? `(${supplier.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="ad-filter-group ad-search">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shipments..."
              className="ad-input"
            />
          </div>
        </div>
        
        {filteredShipments.length === 0 ? (
          <div className="ad-empty">
            <p>No shipments found matching your criteria.</p>
          </div>
        ) : (
          <div className="ad-shipments">
            {filteredShipments.map((shipment) => (
              <div key={shipment._id} className="ad-shipment-card">
                <div className="ad-shipment-header">
                  <div>
                    <h4 className="ad-shipment-title">
                      {shipment.orderDeliveryId?.productId?.productName || "Product Unavailable"}
                    </h4>
                    <p className="ad-shipment-subtext">
                      Order #{shipment.orderDeliveryId?._id?.substring(0, 8) || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className={`ad-status ${getStatusClass(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                  </div>
                </div>
                
                <div className="ad-shipment-supplier">
                  <p className="ad-supplier-name">
                    Supplier: {shipment.orderDeliveryId?.supplierId?.name || "Unknown"}
                    {shipment.orderDeliveryId?.supplierId?.companyName && 
                      ` (${shipment.orderDeliveryId.supplierId.companyName})`}
                  </p>
                </div>
                
                <div className="ad-shipment-details">
                  <div className="ad-shipment-info-grid">
                    <div className="ad-shipment-info-group">
                      <p className="ad-shipment-label">Quantity:</p>
                      <p className="ad-shipment-value">{shipment.orderDeliveryId?.quantity || "N/A"}</p>
                    </div>
                    <div className="ad-shipment-info-group">
                      <p className="ad-shipment-label">Total Value:</p>
                      <p className="ad-shipment-value">
                        Rs{shipment.orderDeliveryId?.totalAmount?.toFixed(2) || "N/A"}
                      </p>
                    </div>
                    <div className="ad-shipment-info-group">
                      <p className="ad-shipment-label">Carrier:</p>
                      <p className="ad-shipment-value">{shipment.carrier || "Not specified"}</p>
                    </div>
                    <div className="ad-shipment-info-group">
                      <p className="ad-shipment-label">Tracking #:</p>
                      <p className="ad-shipment-value">{shipment.trackingNumber || "Not provided"}</p>
                    </div>
                    <div className="ad-shipment-info-group">
                      <p className="ad-shipment-label">Created:</p>
                      <p className="ad-shipment-value">{formatDateTime(shipment.createdAt)}</p>
                    </div>
                    <div className="ad-shipment-info-group">
                      <p className="ad-shipment-label">Expected Delivery:</p>
                      <p className="ad-shipment-value">{formatDate(shipment.expectedDeliveryDate)}</p>
                    </div>
                    {shipment.status === "delivered" && (
                      <div className="ad-shipment-info-group">
                        <p className="ad-shipment-label">Delivered On:</p>
                        <p className="ad-shipment-value">
                          {formatDateTime(shipment.actualDeliveryDate)}
                        </p>
                      </div>
                    )}
                    <div className="ad-shipment-info-group">
                      <p className="ad-shipment-label">Last Updated:</p>
                      <p className="ad-shipment-value">{formatDateTime(shipment.lastUpdated)}</p>
                    </div>
                  </div>
                  
                  {shipment.deliveryNotes && (
                    <div className="ad-shipment-notes">
                      <p className="ad-shipment-label">Delivery Notes:</p>
                      <p className="ad-shipment-value">{shipment.deliveryNotes}</p>
                    </div>
                  )}
                  
                  {shipment.status === "failed_delivery" && (
                    <div className="ad-shipment-alert">
                      <p className="ad-alert-text">
                        ⚠️ This shipment has a failed delivery status. Contact the supplier.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeliveries;