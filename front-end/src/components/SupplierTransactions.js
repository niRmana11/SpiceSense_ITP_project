import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/SupplierTransactions.css";

const SupplierTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let url = "http://localhost:5000/api/transactions/supplier";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      
      const response = await axios.get(url, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = async (transactionId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/transactions/${transactionId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setActiveTransaction(response.data.transaction);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      setError("Failed to load transaction details. Please try again.");
    }
  };
  
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setActiveTransaction(null);
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "processing": return "Processing";
      case "paid": return "Paid";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "refunded": return "Refunded";
      default: return status;
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case "pending": return "st-status-pending";
      case "processing": return "st-status-processing";
      case "paid": return "st-status-paid";
      case "completed": return "st-status-completed";
      case "cancelled": return "st-status-cancelled";
      case "refunded": return "st-status-refunded";
      default: return "st-status-default";
    }
  };
  
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "bank_transfer": return "Bank Transfer";
      case "credit_card": return "Credit Card";
      case "check": return "Check";
      case "cash": return "Cash";
      case "online_payment": return "Online Payment";
      default: return method;
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
  
  const formatCurrency = (amount) => {
    return `Rs${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="st-loading-container">
        <div className="st-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="st-container">
      <div className="st-card">
        <h2 className="st-title">Transaction History</h2>
        
        {error && (
          <div className="st-error">
            {error}
          </div>
        )}
        
        <div className="st-filter">
          <label className="st-label">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="st-select"
          >
            <option value="all">All Transactions</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        
        {transactions.length === 0 ? (
          <div className="st-empty">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="st-table-container">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="st-table-row">
                    <td>{transaction.invoiceNumber}</td>
                    <td>{transaction.orderDeliveryId?.productId?.productName || "Unknown Product"}</td>
                    <td>{formatCurrency(transaction.amount)}</td>
                    <td>{formatDate(transaction.dueDate)}</td>
                    <td>
                      <span className={`st-status ${getStatusClass(transaction.status)}`}>
                        {getStatusLabel(transaction.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(transaction._id)}
                        className="st-view-btn"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Transaction Details Modal */}
      {showDetailsModal && activeTransaction && (
        <div className="st-modal">
          <div className="st-modal-content">
            <div className="st-modal-header">
              <h3 className="st-modal-title">Transaction Details</h3>
              <button 
                className="st-modal-close"
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>
            
            <div className="st-modal-body">
              <div className="st-detail-header">
                <div>
                  <h4 className="st-invoice-number">{activeTransaction.invoiceNumber}</h4>
                  <p className="st-product-name">
                    {activeTransaction.orderDeliveryId?.productId?.productName || "Unknown Product"}
                  </p>
                </div>
                <div>
                  <span className={`st-status-large ${getStatusClass(activeTransaction.status)}`}>
                    {getStatusLabel(activeTransaction.status)}
                  </span>
                </div>
              </div>
              
              <div className="st-detail-grid">
                <div className="st-detail-group">
                  <p className="st-detail-label">Amount:</p>
                  <p className="st-detail-value">{formatCurrency(activeTransaction.amount)}</p>
                </div>
                <div className="st-detail-group">
                  <p className="st-detail-label">Payment Method:</p>
                  <p className="st-detail-value">{getPaymentMethodLabel(activeTransaction.paymentMethod)}</p>
                </div>
                <div className="st-detail-group">
                  <p className="st-detail-label">Created Date:</p>
                  <p className="st-detail-value">{formatDate(activeTransaction.createdAt)}</p>
                </div>
                <div className="st-detail-group">
                  <p className="st-detail-label">Due Date:</p>
                  <p className="st-detail-value">{formatDate(activeTransaction.dueDate)}</p>
                </div>
                {activeTransaction.paymentDate && (
                  <div className="st-detail-group">
                    <p className="st-detail-label">Payment Date:</p>
                    <p className="st-detail-value">{formatDate(activeTransaction.paymentDate)}</p>
                  </div>
                )}
                {activeTransaction.completedDate && (
                  <div className="st-detail-group">
                    <p className="st-detail-label">Completed Date:</p>
                    <p className="st-detail-value">{formatDate(activeTransaction.completedDate)}</p>
                  </div>
                )}
                {activeTransaction.paymentReference && (
                  <div className="st-detail-group">
                    <p className="st-detail-label">Payment Reference:</p>
                    <p className="st-detail-value">{activeTransaction.paymentReference}</p>
                  </div>
                )}
              </div>
              
              <div className="st-order-details">
                <h4 className="st-section-title">Order Details</h4>
                <div className="st-detail-grid">
                  <div className="st-detail-group">
                    <p className="st-detail-label">Order ID:</p>
                    <p className="st-detail-value">
                      {activeTransaction.orderDeliveryId?._id.substring(0, 8) || "N/A"}
                    </p>
                  </div>
                  <div className="st-detail-group">
                    <p className="st-detail-label">Quantity:</p>
                    <p className="st-detail-value">
                      {activeTransaction.orderDeliveryId?.quantity || "N/A"}
                    </p>
                  </div>
                  <div className="st-detail-group">
                    <p className="st-detail-label">Product Category:</p>
                    <p className="st-detail-value">
                      {activeTransaction.orderDeliveryId?.productId?.productCategory || "N/A"}
                    </p>
                  </div>
                  <div className="st-detail-group">
                    <p className="st-detail-label">Order Status:</p>
                    <p className="st-detail-value">
                      {activeTransaction.orderDeliveryId?.orderStatus || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              
              {activeTransaction.notes && (
                <div className="st-notes">
                  <h4 className="st-section-title">Notes</h4>
                  <p className="st-notes-text">{activeTransaction.notes}</p>
                </div>
              )}
              
              <div className="st-admin-info">
                <p className="st-admin-text">
                  Created by: {activeTransaction.adminId?.name || "Unknown Admin"}
                </p>
              </div>
            </div>
            
            <div className="st-modal-footer">
              <button
                onClick={handleCloseModal}
                className="st-button st-button-close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierTransactions;