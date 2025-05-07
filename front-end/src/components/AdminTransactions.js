import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/AdminTransactions.css";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  const [createFormData, setCreateFormData] = useState({
    orderDeliveryId: "",
    amount: "",
    paymentMethod: "bank_transfer",
    dueDate: "",
    notes: ""
  });
  
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    paymentReference: "",
    notes: "",
    paymentMethod: ""
  });
  
  const paymentMethods = [
    { value: "bank_transfer", label: "Bank Transfer", refLabel: "Transaction ID/Reference Number" },
    { value: "cash", label: "Cash", refLabel: "Receipt Number" },
    { value: "check", label: "Check", refLabel: "Check Number" },
    { value: "company_credit", label: "Company Credit", refLabel: "Credit Reference" },
    { value: "online_payment", label: "Online Payment", refLabel: "Payment ID" }
  ];
  
  useEffect(() => {
    fetchTransactions();
    fetchSuppliers();
    fetchOrders();
  }, [statusFilter, supplierFilter]);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let url = "http://localhost:5000/api/transactions/admin";
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
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions. Please try again.");
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
  
  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/orderdelivers/admin?status=delivered", {
        withCredentials: true,
      });
      
      if (response.data.success) {
        const orderIds = new Set(transactions.map(t => t.orderDeliveryId?._id || t.orderDeliveryId));
        const filteredOrders = response.data.orders.filter(order => !orderIds.has(order._id));
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  
  const handleOpenCreateModal = () => {
    if (orders.length === 0) {
      setError("No eligible orders found for creating transactions.");
      return;
    }
    
    setCreateFormData({
      orderDeliveryId: orders[0]._id,
      amount: orders[0].totalAmount || "",
      paymentMethod: "bank_transfer",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ""
    });
    
    setShowCreateModal(true);
  };
  
  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: value
    });
    
    if (name === "orderDeliveryId") {
      const selectedOrder = orders.find(order => order._id === value);
      if (selectedOrder) {
        setCreateFormData(prevData => ({
          ...prevData,
          amount: selectedOrder.totalAmount || ""
        }));
      }
    }
  };
  
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };
  
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/transactions",
        createFormData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        fetchTransactions();
        fetchOrders();
        setShowCreateModal(false);
        setError(null);
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      setError("Failed to create transaction. " + (error.response?.data?.message || "Please try again."));
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
  
  const handleOpenUpdateModal = (transaction) => {
    setActiveTransaction(transaction);
    setUpdateFormData({
      status: "",
      paymentMethod: transaction.paymentMethod || "bank_transfer",
      paymentReference: transaction.paymentReference || "",
      notes: transaction.notes || ""
    });
    setShowUpdateModal(true);
  };
  
  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData({
      ...updateFormData,
      [name]: value
    });
  };
  
  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setActiveTransaction(null);
  };
  
  // Updated handleUpdateTransaction to refetch the full transaction list after a successful update
  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    
    if (!activeTransaction) return;
    
    if (!updateFormData.status) {
      setError("Please select a status to update");
      return;
    }
    
    try {
      const dataToUpdate = {
        ...updateFormData,
        paymentMethod: updateFormData.paymentMethod || activeTransaction.paymentMethod,
      };
      
      const response = await axios.put(
        `http://localhost:5000/api/transactions/${activeTransaction._id}/status`,
        dataToUpdate,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Instead of manually updating the state, refetch the full transaction list
        // This ensures the UI has the complete data, including nested fields like supplierId and orderDeliveryId
        await fetchTransactions();
        setShowUpdateModal(false);
        setActiveTransaction(null);
        setError(null);
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError("Failed to update transaction. " + (error.response?.data?.message || "Please try again."));
    }
  };
  
  const handleCloseDetailsModal = () => {
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
      case "pending": return "at-status-pending";
      case "processing": return "at-status-processing";
      case "paid": return "at-status-paid";
      case "completed": return "at-status-completed";
      case "cancelled": return "at-status-cancelled";
      case "refunded": return "at-status-refunded";
      default: return "at-status-default";
    }
  };
  
  const getPaymentMethodLabel = (method) => {
    const foundMethod = paymentMethods.find(m => m.value === method);
    return foundMethod ? foundMethod.label : method;
  };
  
  const getPaymentReferenceLabel = (method) => {
    const foundMethod = paymentMethods.find(m => m.value === method);
    return foundMethod ? foundMethod.refLabel : "Payment Reference";
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
  
  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return [
          { value: "processing", label: "Mark as Processing" },
          { value: "paid", label: "Mark as Paid" },
          { value: "cancelled", label: "Cancel Transaction" }
        ];
      case "processing":
        return [
          { value: "paid", label: "Mark as Paid" },
          { value: "cancelled", label: "Cancel Transaction" }
        ];
      case "paid":
        return [
          { value: "completed", label: "Mark as Completed" },
          { value: "refunded", label: "Mark as Refunded" }
        ];
      case "completed":
        return [
          { value: "refunded", label: "Mark as Refunded" }
        ];
      case "cancelled":
        return [
          { value: "pending", label: "Reopen as Pending" }
        ];
      case "refunded":
        return [
          { value: "completed", label: "Mark as Completed" }
        ];
      default:
        return [];
    }
  };
  
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const invoiceNumber = transaction.invoiceNumber.toLowerCase();
    const productName = transaction.orderDeliveryId?.productId?.productName?.toLowerCase() || "";
    const supplierName = transaction.supplierId?.name?.toLowerCase() || "";
    const companyName = transaction.supplierId?.companyName?.toLowerCase() || "";
    
    const term = searchTerm.toLowerCase();
    
    return invoiceNumber.includes(term) || 
           productName.includes(term) || 
           supplierName.includes(term) || 
           companyName.includes(term);
  });

  if (loading) {
    return (
      <div className="at-loading-container">
        <div className="at-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="at-container">
      <div className="at-card">
        <div className="at-header">
          <h2 className="at-title">Transaction Management</h2>
          <button
            onClick={handleOpenCreateModal}
            className="at-create-btn"
            disabled={orders.length === 0}
          >
            New Transaction
          </button>
        </div>
        
        {error && (
          <div className="at-error">
            {error}
          </div>
        )}
        
        <div className="at-filters">
          <div className="at-filter-group">
            <label className="at-label">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="at-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <div className="at-filter-group">
            <label className="at-label">Supplier:</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="at-select"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name} {supplier.companyName ? `(${supplier.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="at-filter-group at-search">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="at-input"
            />
          </div>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="at-empty">
            <p>No transactions found matching your criteria.</p>
          </div>
        ) : (
          <div className="at-table-container">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="at-table-row">
                    <td>{transaction.invoiceNumber}</td>
                    <td>
                      {transaction.supplierId?.name || "Unknown"}
                      {transaction.supplierId?.companyName && ` (${transaction.supplierId.companyName})`}
                    </td>
                    <td>{transaction.orderDeliveryId?.productId?.productName || "Unknown Product"}</td>
                    <td>{formatCurrency(transaction.amount)}</td>
                    <td>{getPaymentMethodLabel(transaction.paymentMethod)}</td>
                    <td>{formatDate(transaction.dueDate)}</td>
                    <td>
                      <span className={`at-status ${getStatusClass(transaction.status)}`}>
                        {getStatusLabel(transaction.status)}
                      </span>
                    </td>
                    <td className="at-actions">
                      <button
                        onClick={() => handleViewDetails(transaction._id)}
                        className="at-view-btn"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenUpdateModal(transaction)}
                        className="at-update-btn"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showCreateModal && (
        <div className="at-modal">
          <div className="at-modal-content">
            <div className="at-modal-header">
              <h3 className="at-modal-title">Create New Transaction</h3>
              <button 
                className="at-modal-close"
                onClick={handleCloseCreateModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateTransaction}>
              <div className="at-modal-body">
                <div className="at-form-group">
                  <label className="at-form-label">Select Order *</label>
                  <select
                    name="orderDeliveryId"
                    value={createFormData.orderDeliveryId}
                    onChange={handleCreateInputChange}
                    required
                    className="at-form-select"
                  >
                    <option value="">Select an order</option>
                    {orders.map(order => (
                      <option key={order._id} value={order._id}>
                        {order.productId?.productName} - {formatCurrency(order.totalAmount)} 
                        ({order.supplierId?.name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">Amount (Rs) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={createFormData.amount}
                    onChange={handleCreateInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    className="at-form-input"
                  />
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={createFormData.paymentMethod}
                    onChange={handleCreateInputChange}
                    required
                    className="at-form-select"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={createFormData.dueDate}
                    onChange={handleCreateInputChange}
                    required
                    className="at-form-input"
                  />
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={createFormData.notes}
                    onChange={handleCreateInputChange}
                    className="at-form-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="at-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="at-button at-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="at-button at-button-submit"
                >
                  Create Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showUpdateModal && activeTransaction && (
        <div className="at-modal">
          <div className="at-modal-content">
            <div className="at-modal-header">
              <h3 className="at-modal-title">Update Transaction Status</h3>
              <button 
                className="at-modal-close"
                onClick={handleCloseUpdateModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateTransaction}>
              <div className="at-modal-body">
                <div className="at-transaction-info">
                  <p className="at-transaction-invoice">{activeTransaction.invoiceNumber}</p>
                  <p className="at-transaction-supplier">
                    Supplier: {activeTransaction.supplierId?.name} 
                    {activeTransaction.supplierId?.companyName && ` (${activeTransaction.supplierId.companyName})`}
                  </p>
                  <p className="at-transaction-amount">
                    Amount: {formatCurrency(activeTransaction.amount)}
                  </p>
                  <p className="at-transaction-status">
                    Current Status: <span className={getStatusClass(activeTransaction.status)}>
                      {getStatusLabel(activeTransaction.status)}
                    </span>
                  </p>
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">New Status *</label>
                  <select
                    name="status"
                    value={updateFormData.status}
                    onChange={handleUpdateInputChange}
                    required
                    className="at-form-select"
                  >
                    <option value="">Select new status</option>
                    {getNextStatusOptions(activeTransaction.status).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={updateFormData.paymentMethod}
                    onChange={handleUpdateInputChange}
                    className="at-form-select"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">
                    {getPaymentReferenceLabel(updateFormData.paymentMethod)}
                  </label>
                  <input
                    type="text"
                    name="paymentReference"
                    value={updateFormData.paymentReference}
                    onChange={handleUpdateInputChange}
                    className="at-form-input"
                    placeholder={getPaymentReferenceLabel(updateFormData.paymentMethod)}
                  />
                </div>
                
                <div className="at-form-group">
                  <label className="at-form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={updateFormData.notes}
                    onChange={handleUpdateInputChange}
                    className="at-form-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="at-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseUpdateModal}
                  className="at-button at-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="at-button at-button-submit"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showDetailsModal && activeTransaction && (
        <div className="at-modal">
          <div className="at-modal-content at-modal-large">
            <div className="at-modal-header">
              <h3 className="at-modal-title">Transaction Details</h3>
              <button 
                className="at-modal-close"
                onClick={handleCloseDetailsModal}
              >
                ×
              </button>
            </div>
            
            <div className="at-modal-body">
              <div className="at-detail-header">
                <div>
                  <h4 className="at-invoice-number">{activeTransaction.invoiceNumber}</h4>
                  <p className="at-product-name">
                    {activeTransaction.orderDeliveryId?.productId?.productName || "Unknown Product"}
                  </p>
                </div>
                <div>
                  <span className={`at-status-large ${getStatusClass(activeTransaction.status)}`}>
                    {getStatusLabel(activeTransaction.status)}
                  </span>
                </div>
              </div>
              
              <div className="at-detail-section">
                <h4 className="at-section-title">Transaction Information</h4>
                <div className="at-detail-grid">
                  <div className="at-detail-group">
                    <p className="at-detail-label">Amount:</p>
                    <p className="at-detail-value">{formatCurrency(activeTransaction.amount)}</p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Payment Method:</p>
                    <p className="at-detail-value">{getPaymentMethodLabel(activeTransaction.paymentMethod)}</p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Created Date:</p>
                    <p className="at-detail-value">{formatDate(activeTransaction.createdAt)}</p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Due Date:</p>
                    <p className="at-detail-value">{formatDate(activeTransaction.dueDate)}</p>
                  </div>
                  {activeTransaction.paymentDate && (
                    <div className="at-detail-group">
                      <p className="at-detail-label">Payment Date:</p>
                      <p className="at-detail-value">{formatDate(activeTransaction.paymentDate)}</p>
                    </div>
                  )}
                  {activeTransaction.completedDate && (
                    <div className="at-detail-group">
                      <p className="at-detail-label">Completed Date:</p>
                      <p className="at-detail-value">{formatDate(activeTransaction.completedDate)}</p>
                    </div>
                  )}
                  {activeTransaction.paymentReference && (
                    <div className="at-detail-group">
                      <p className="at-detail-label">{getPaymentReferenceLabel(activeTransaction.paymentMethod)}:</p>
                      <p className="at-detail-value">{activeTransaction.paymentReference}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="at-detail-section">
                <h4 className="at-section-title">Supplier Information</h4>
                <div className="at-detail-grid">
                  <div className="at-detail-group">
                    <p className="at-detail-label">Supplier Name:</p>
                    <p className="at-detail-value">{activeTransaction.supplierId?.name || "Unknown"}</p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Company Name:</p>
                    <p className="at-detail-value">{activeTransaction.supplierId?.companyName || "Not provided"}</p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Email:</p>
                    <p className="at-detail-value">{activeTransaction.supplierId?.email || "Unknown"}</p>
                  </div>
                </div>
              </div>
              
              <div className="at-detail-section">
                <h4 className="at-section-title">Order Details</h4>
                <div className="at-detail-grid">
                  <div className="at-detail-group">
                    <p className="at-detail-label">Order ID:</p>
                    <p className="at-detail-value">
                      {activeTransaction.orderDeliveryId?._id || "N/A"}
                    </p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Product:</p>
                    <p className="at-detail-value">
                      {activeTransaction.orderDeliveryId?.productId?.productName || "N/A"}
                    </p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Category:</p>
                    <p className="at-detail-value">
                      {activeTransaction.orderDeliveryId?.productId?.productCategory || "N/A"}
                    </p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Quantity:</p>
                    <p className="at-detail-value">
                      {activeTransaction.orderDeliveryId?.quantity || "N/A"}
                    </p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Unit Price:</p>
                    <p className="at-detail-value">
                      {activeTransaction.orderDeliveryId?.price ? 
                        formatCurrency(activeTransaction.orderDeliveryId.price) : "N/A"}
                    </p>
                  </div>
                  <div className="at-detail-group">
                    <p className="at-detail-label">Order Status:</p>
                    <p className="at-detail-value">
                      {activeTransaction.orderDeliveryId?.orderStatus || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              
              {activeTransaction.notes && (
                <div className="at-detail-section">
                  <h4 className="at-section-title">Notes</h4>
                  <p className="at-notes-text">{activeTransaction.notes}</p>
                </div>
              )}
              
              <div className="at-detail-actions">
                <button
                  onClick={() => {
                    handleCloseDetailsModal();
                    handleOpenUpdateModal(activeTransaction);
                  }}
                  className="at-button at-button-update"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;