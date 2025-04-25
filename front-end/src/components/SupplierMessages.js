import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/SupplierMessages.css";

const SupplierMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeMessage, setActiveMessage] = useState(null);
  
  const [responseForm, setResponseForm] = useState({
    status: "approved",
    approvedQuantity: "",
    approvedPrice: "",
    rejectReason: "",
  });

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get("http://localhost:5000/api/messages/supplier", {
          withCredentials: true,
        });
        
        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, []);
  
  const filteredMessages = messages.filter(message => 
    statusFilter === "all" || message.status === statusFilter
  );
  
  const handleOpenResponseForm = (message) => {
    setActiveMessage(message);
    setResponseForm({
      status: "approved",
      approvedQuantity: message.requestedQuantity.toString(),
      approvedPrice: message.productId?.price.toString() || "",
      rejectReason: "",
    });
    
    if (!message.seen) {
      markMessageAsSeen(message._id);
    }
  };
  
  const handleCloseResponseForm = () => {
    setActiveMessage(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResponseForm({
      ...responseForm,
      [name]: value
    });
  };
  
  const handleStatusChange = (e) => {
    const status = e.target.value;
    setResponseForm({
      ...responseForm,
      status
    });
  };

  const markMessageAsSeen = async (messageId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/messages/seen/${messageId}`,
        {},
        { withCredentials: true }
      );
      
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, seen: true } : msg
      ));
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  };
  
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!activeMessage) return;
    
    if (responseForm.status === "approved") {
      if (!responseForm.approvedQuantity || !responseForm.approvedPrice) {
        setError("Approved quantity and price are required for approval");
        return;
      }
    } else {
      if (!responseForm.rejectReason) {
        setError("Reason for rejection is required");
        return;
      }
    }
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/messages/respond/${activeMessage._id}`,
        responseForm,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessages(messages.map(msg => 
          msg._id === activeMessage._id ? response.data.data : msg
        ));
        setActiveMessage(null);
        setError(null);
      }
    } catch (error) {
      console.error("Error responding to message:", error);
      setError("Failed to send response. Please try again.");
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "sm-status-pending";
      case "approved":
        return "sm-status-approved";
      case "rejected":
        return "sm-status-rejected";
      default:
        return "sm-status-default";
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
      <div className="sm-loading-container">
        <div className="sm-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="sm-container">
      <div className="sm-card">
        <h2 className="sm-title">
          Product Requests from Admin
        </h2>
        
        {error && (
          <div className="sm-error">
            {error}
          </div>
        )}
        
        <div className="sm-filter">
          <label className="sm-label">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm-select"
          >
            <option value="all">All Messages</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        {activeMessage && (
          <div className="sm-modal">
            <div className="sm-modal-content">
              <h3 className="sm-modal-title">
                Respond to Product Request
              </h3>
              
              <div className="sm-modal-info">
                <p className="sm-modal-product">{activeMessage.productId?.productName}</p>
                <p className="sm-modal-subtext">
                  Requested Quantity: {activeMessage.requestedQuantity}
                </p>
              </div>
              
              <form onSubmit={handleSubmitResponse}>
                <div className="sm-form-group">
                  <label className="sm-label">Response Type</label>
                  <div className="sm-radio-group">
                    <label className="sm-radio-label">
                      <input
                        type="radio"
                        name="status"
                        value="approved"
                        checked={responseForm.status === "approved"}
                        onChange={handleStatusChange}
                        className="sm-radio"
                      />
                      <span className="sm-radio-text">Approve</span>
                    </label>
                    <label className="sm-radio-label">
                      <input
                        type="radio"
                        name="status"
                        value="rejected"
                        checked={responseForm.status === "rejected"}
                        onChange={handleStatusChange}
                        className="sm-radio"
                      />
                      <span className="sm-radio-text">Reject</span>
                    </label>
                  </div>
                </div>
                
                {responseForm.status === "approved" ? (
                  <div className="sm-form-details">
                    <div className="sm-form-group">
                      <label className="sm-label">Approved Quantity *</label>
                      <input
                        type="number"
                        name="approvedQuantity"
                        value={responseForm.approvedQuantity}
                        onChange={handleInputChange}
                        min="1"
                        required
                        className="sm-input"
                      />
                    </div>
                    
                    <div className="sm-form-group">
                      <label className="sm-label">Approved Price (Rs) *</label>
                      <input
                        type="number"
                        name="approvedPrice"
                        value={responseForm.approvedPrice}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        required
                        className="sm-input"
                      />
                    </div>
                    
                    <div className="sm-total">
                      <p className="sm-total-text">
                        Total Value: Rs{(
                          Number(responseForm.approvedQuantity) * 
                          Number(responseForm.approvedPrice)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="sm-form-group">
                    <label className="sm-label">Reason for Rejection *</label>
                    <textarea
                      name="rejectReason"
                      value={responseForm.rejectReason}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="sm-textarea"
                      placeholder="Please provide a reason for rejecting this request..."
                    ></textarea>
                  </div>
                )}
                
                <div className="sm-modal-buttons">
                  <button
                    type="button"
                    onClick={handleCloseResponseForm}
                    className="sm-button sm-button-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sm-button sm-button-submit"
                  >
                    Submit Response
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {filteredMessages.length === 0 ? (
          <div className="sm-empty">
            <p>No messages found.</p>
          </div>
        ) : (
          <div className="sm-messages">
            {filteredMessages.map((message) => (
              <div 
                key={message._id} 
                className={`sm-message ${message.seen ? "sm-message-seen" : "sm-message-unseen"}`}
              >
                <div className="sm-message-header">
                  <div>
                    <h3 className="sm-message-title">
                      {message.productId?.productName || "Product Unavailable"}
                    </h3>
                    <p className="sm-message-subtext">
                      Category: {message.productId?.productCategory || "N/A"} | 
                      Original Price: Rs{message.productId?.price || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className={`sm-status ${getStatusClass(message.status)}`}>
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="sm-message-body">
                  <div>
                    <p className="sm-message-text">
                      <span className="sm-bold">Admin:</span> {message.adminId?.name || "Unknown"}
                    </p>
                    <p className="sm-message-text">
                      <span className="sm-bold">Requested Quantity:</span> {message.requestedQuantity}
                    </p>
                  </div>
                  <div className="sm-message-date">
                    {formatDate(message.createdAt)}
                  </div>
                </div>
                
                {message.status !== "pending" ? (
                  <div className="sm-message-footer">
                    {message.status === "approved" ? (
                      <div className="sm-approved">
                        <p className="sm-message-text">
                          <span className="sm-bold">Approved Quantity:</span> {message.approvedQuantity}
                        </p>
                        <p className="sm-message-text">
                          <span className="sm-bold">Approved Price:</span> Rs{message.approvedPrice}
                        </p>
                        <p className="sm-message-text">
                          <span className="sm-bold">Total Value:</span> Rs{(message.approvedQuantity * message.approvedPrice).toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div className="sm-rejected">
                        <p className="sm-message-text">
                          <span className="sm-bold">Rejection Reason:</span> {message.rejectReason}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sm-message-action">
                    <button
                      onClick={() => handleOpenResponseForm(message)}
                      className="sm-button sm-button-respond"
                    >
                      Respond
                    </button>
                  </div>
                )}
                
                {!message.seen && (
                  <div className="sm-new-request">
                    <span className="sm-new-badge">New Request</span>
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

export default SupplierMessages;