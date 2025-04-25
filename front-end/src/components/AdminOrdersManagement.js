
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/AdminOrdersManagement.css';

const AdminOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentOrderDetail, setCurrentOrderDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [showCreateDeliveryModal, setShowCreateDeliveryModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDeliveryDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      filterOrders();
    }
  }, [statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      // Modified to use an existing endpoint - the more generic one for fetching orders
      const response = await axios.get('http://localhost:5000/api/order');
      
      console.log('Orders response:', response.data);
      
      // Ensure we're handling the response correctly based on its structure
      const ordersData = Array.isArray(response.data) ? response.data : 
                         response.data.orders ? response.data.orders : [];
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      // More detailed error message for debugging
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to load orders. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      setIsLoading(true);
      const orderResponse = await axios.get(`http://localhost:5000/api/order/${orderId}`);
      console.log('Order details response:', orderResponse.data);
      setCurrentOrderDetail(orderResponse.data);

      // Try to fetch delivery info if it exists
      try {
        const deliveryResponse = await axios.get(`http://localhost:5000/api/deliveries/order/${orderId}`);
        console.log('Delivery info response:', deliveryResponse.data);
        setDeliveryInfo(deliveryResponse.data);
      } catch (error) {
        console.log('No delivery found or error fetching delivery:', error.message);
        // If no delivery exists yet, that's fine
        setDeliveryInfo(null);
      }

      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      alert('Failed to load order details: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const createDelivery = () => {
    setTrackingInfo({
      trackingNumber: '',
      carrier: '',
      estimatedDeliveryDate: '',
      notes: ''
    });
    setShowCreateDeliveryModal(true);
  };

  const handleCreateDelivery = async () => {
    try {
      const deliveryData = {
        orderId: currentOrderDetail._id,
        trackingNumber: trackingInfo.trackingNumber,
        carrier: trackingInfo.carrier,
        estimatedDeliveryDate: trackingInfo.estimatedDeliveryDate,
        deliveryNotes: trackingInfo.notes,
        status: 'ready for shipment'
      };

      console.log('Creating delivery with data:', deliveryData);
      const deliveryResponse = await axios.post('http://localhost:5000/api/deliveries/create', deliveryData);
      console.log('Delivery creation response:', deliveryResponse.data);
     
      // Update order status
      await axios.put(`http://localhost:5000/api/order/${currentOrderDetail._id}`, {
        status: 'ready for shipment'
      });

      // Refresh data
      fetchOrders();
      setShowCreateDeliveryModal(false);
     
      // Re-fetch the current order and delivery
      viewOrderDetails(currentOrderDetail._id);
     
      alert('Delivery created successfully!');
    } catch (err) {
      console.error('Error creating delivery:', err);
      alert('Failed to create delivery: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateDeliveryStatus = () => {
    setShowUpdateStatusModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      // Update delivery status
      await axios.put(`http://localhost:5000/api/deliveries/${deliveryInfo._id}/status`, {
        status: newStatus
      });
     
      // Update order status to match
      await axios.put(`http://localhost:5000/api/order/${currentOrderDetail._id}`, {
        status: newStatus
      });

      // Refresh data
      fetchOrders();
      setShowUpdateStatusModal(false);
     
      // Re-fetch the current order and delivery
      viewOrderDetails(currentOrderDetail._id);
     
      alert(`Status updated to: ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="admin-orders-container">
      <h2>Orders Management</h2>
     
      {/* Status filter */}
      <div className="orders-filter-section">
        <label htmlFor="status-filter">Filter by Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter-select"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="ready for shipment">Ready for Shipment</option>
          <option value="shipped">Shipped</option>
          <option value="in transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Orders table */}
      {isLoading ? (
        <div className="orders-loading">Loading orders...</div>
      ) : error ? (
        <div className="orders-error">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders">No orders found with the selected status.</div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id} className={`order-row status-${order.status?.replace(/\s+/g, '-') || 'unknown'}`}>
                <td>{order._id.substring(0, 8)}...</td>
                <td>{order.userId ? order.userId.substring(0, 8) + '...' : 'Unknown'}</td>
                <td>${order.total?.toFixed(2) || '0.00'}</td>
                <td>
                  <span className={`status-badge status-${order.status?.replace(/\s+/g, '-') || 'unknown'}`}>
                    {order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : 'Unknown'}
                  </span>
                </td>
                <td>{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => viewOrderDetails(order._id)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && currentOrderDetail && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Order Details (ID: {currentOrderDetail._id})</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
           
            <div className="modal-body">
              <h4>Customer Information</h4>
              <p><strong>Customer ID:</strong> {currentOrderDetail.userId}</p>
              <p><strong>Shipping Address:</strong> {currentOrderDetail.shippingAddress}</p>
              <p><strong>Billing Address:</strong> {currentOrderDetail.billingAddress}</p>
             
              <h4>Items</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrderDetail.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.itemId?.name || `Item ${index + 1}`}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price?.toFixed(2) || '0.00'}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
             
              <div className="order-summary">
                <p><strong>Total:</strong> ${currentOrderDetail.total?.toFixed(2) || '0.00'}</p>
                <p><strong>Status:</strong> {currentOrderDetail.status}</p>
              </div>
             
              {/* Delivery Information (if exists) */}
              {deliveryInfo ? (
                <div className="delivery-info-section">
                  <h4>Delivery Information</h4>
                  <p><strong>Status:</strong> {deliveryInfo.status}</p>
                  <p><strong>Tracking Number:</strong> {deliveryInfo.trackingNumber || 'Not available'}</p>
                  <p><strong>Carrier:</strong> {deliveryInfo.carrier || 'Not specified'}</p>
                  <p>
                    <strong>Estimated Delivery:</strong>
                    {deliveryInfo.estimatedDeliveryDate ? formatDate(deliveryInfo.estimatedDeliveryDate) : 'Not set'}
                  </p>
                  {deliveryInfo.deliveryNotes && (
                    <p><strong>Notes:</strong> {deliveryInfo.deliveryNotes}</p>
                  )}
                </div>
              ) : (
                <div className="no-delivery-info">
                  <p>No delivery record created yet.</p>
                </div>
              )}
            </div>
           
            <div className="modal-footer">
              {currentOrderDetail.status === 'paid' && !deliveryInfo && (
                <button className="ready-shipment-btn" onClick={createDelivery}>
                  Mark Ready for Shipment
                </button>
              )}
             
              {deliveryInfo && (
                <button className="update-status-btn" onClick={updateDeliveryStatus}>
                  Update Status
                </button>
              )}
             
              <button className="close-modal-btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {showCreateDeliveryModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Delivery Record</h3>
              <button className="close-btn" onClick={() => setShowCreateDeliveryModal(false)}>×</button>
            </div>
           
            <div className="modal-body">
              <div className="form-group">
                <label>Tracking Number</label>
                <input
                  type="text"
                  value={trackingInfo.trackingNumber}
                  onChange={(e) => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                />
              </div>
             
              <div className="form-group">
                <label>Carrier</label>
                <select
                  value={trackingInfo.carrier}
                  onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                >
                  <option value="">Select a carrier</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                </select>
              </div>
             
              <div className="form-group">
                <label>Estimated Delivery Date</label>
                <input
                  type="date"
                  value={trackingInfo.estimatedDeliveryDate}
                  onChange={(e) => setTrackingInfo({...trackingInfo, estimatedDeliveryDate: e.target.value})}
                />
              </div>
             
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={trackingInfo.notes}
                  onChange={(e) => setTrackingInfo({...trackingInfo, notes: e.target.value})}
                />
              </div>
            </div>
           
            <div className="modal-footer">
              <button className="create-btn" onClick={handleCreateDelivery}>
                Create Delivery
              </button>
              <button className="cancel-btn" onClick={() => setShowCreateDeliveryModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateStatusModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Delivery Status</h3>
              <button className="close-btn" onClick={() => setShowUpdateStatusModal(false)}>×</button>
            </div>
           
            <div className="modal-body">
              <p>Current Status: <strong>{deliveryInfo?.status}</strong></p>
              <p>Select the new status:</p>
             
              <div className="status-buttons">
                {deliveryInfo?.status !== 'ready for shipment' && (
                  <button
                    className="status-btn ready-btn"
                    onClick={() => handleStatusUpdate('ready for shipment')}
                  >
                    Ready for Shipment
                  </button>
                )}
               
                {deliveryInfo?.status !== 'shipped' && (
                  <button
                    className="status-btn shipped-btn"
                    onClick={() => handleStatusUpdate('shipped')}
                  >
                    Shipped
                  </button>
                )}
               
                {deliveryInfo?.status !== 'in transit' && (
                  <button
                    className="status-btn transit-btn"
                    onClick={() => handleStatusUpdate('in transit')}
                  >
                    In Transit
                  </button>
                )}
               
                {deliveryInfo?.status !== 'delivered' && (
                  <button
                    className="status-btn delivered-btn"
                    onClick={() => handleStatusUpdate('delivered')}
                  >
                    Delivered
                  </button>
                )}
              </div>
            </div>
           
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowUpdateStatusModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersManagement;
