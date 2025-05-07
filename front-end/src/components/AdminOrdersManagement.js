import React, { useState, useEffect } from 'react';
import {
  fetchAllOrders,
  fetchOrder,
  updateOrder,
  fetchDeliveryByOrderId,
  createDelivery,
  updateDeliveryStatus
} from '../api';
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
  const [showDirectStatusUpdate, setShowDirectStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDeliveryDate: '',
    notes: ''
  });
  const [customerName, setCustomerName] = useState('');

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
      const response = await fetchAllOrders();
      console.log('Orders response:', response.data);

      const ordersData = Array.isArray(response.data)
        ? response.data
        : response.data.orders
        ? response.data.orders
        : [];

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
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
      const orderResponse = await fetchOrder(orderId);
      console.log('Order details response:', orderResponse.data);

      const orderData = orderResponse.data.order || orderResponse.data;
      setCurrentOrderDetail(orderData);

      if (orderData.userId && typeof orderData.userId === 'object' && orderData.userId.name) {
        setCustomerName(orderData.userId.name);
      } else {
        setCustomerName('');
      }

      try {
        const deliveryResponse = await fetchDeliveryByOrderId(orderId);
        console.log('Delivery info response:', deliveryResponse.data);
        const deliveryData = deliveryResponse.data.delivery || deliveryResponse.data;
        setDeliveryInfo(deliveryData);
      } catch (error) {
        console.log('No delivery found or error fetching delivery:', error.message);
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

  const createDeliveryRecord = () => {
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
      const deliveryResponse = await createDelivery(deliveryData);
      console.log('Delivery creation response:', deliveryResponse.data);

      await updateOrder(currentOrderDetail._id, {
        status: 'ready for shipment'
      });

      fetchOrders();
      setShowCreateDeliveryModal(false);
      viewOrderDetails(currentOrderDetail._id);

      alert('Delivery created successfully!');
    } catch (err) {
      console.error('Error creating delivery:', err);
      alert('Failed to create delivery: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateDeliveryStatusRecord = () => {
    setShowUpdateStatusModal(true);
  };

  // Validate status transitions
  const isValidStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
      pending: ['paid', 'cancelled'],
      paid: ['ready for shipment', 'cancelled'],
      'ready for shipment': ['shipped', 'cancelled'],
      shipped: ['in transit', 'cancelled'],
      'in transit': ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  const handleStatusUpdate = async (statusToUpdate) => {
    try {
      console.log('Updating status to:', statusToUpdate);

      // Validate status transition
      if (!isValidStatusTransition(currentOrderDetail.status, statusToUpdate)) {
        alert(`Cannot transition from ${currentOrderDetail.status} to ${statusToUpdate}`);
        return;
      }

      // Update delivery status only for relevant statuses
      if (deliveryInfo && ['shipped', 'in transit', 'delivered'].includes(statusToUpdate)) {
        try {
          console.log('Updating delivery status:', { id: deliveryInfo._id, status: statusToUpdate });
          await updateDeliveryStatus(deliveryInfo._id, {
            status: statusToUpdate
          });
          console.log('Delivery status updated successfully');
        } catch (deliveryErr) {
          console.error('Failed to update delivery status:', deliveryErr);
          alert('Failed to update delivery status: ' + (deliveryErr.response?.data?.message || deliveryErr.message));
          return;
        }
      }

      // Update order status
      console.log('Updating order:', { id: currentOrderDetail._id, status: statusToUpdate });
      await updateOrder(currentOrderDetail._id, {
        status: statusToUpdate
      });

      // Refresh data
      fetchOrders();
      setShowUpdateStatusModal(false);
      setShowDirectStatusUpdate(false);
      viewOrderDetails(currentOrderDetail._id);

      alert(`Status updated to: ${statusToUpdate}`);
    } catch (err) {
      console.error('Error updating status:', err.response?.data, err.message);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const openDirectStatusUpdate = () => {
    setNewStatus(currentOrderDetail.status || 'pending');
    setShowDirectStatusUpdate(true);
  };

  const handleDirectStatusUpdate = async () => {
    if (!newStatus) {
      alert('Please select a valid status');
      return;
    }
    console.log('Selected new status:', newStatus);
    await handleStatusUpdate(newStatus);
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
          <option value="cancelled">Cancelled</option>
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
                <td>
                  {order.userId && typeof order.userId === 'object' && order.userId.name
                    ? order.userId.name
                    : typeof order.userId === 'string'
                    ? order.userId.substring(0, 8) + '...'
                    : 'Unknown'}
                </td>
                <td>${order.total?.toFixed(2) || '0.00'}</td>
                <td>
                  <span className={`status-badge status-${order.status?.replace(/\s+/g, '-') || 'unknown'}`}>
                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                  </span>
                </td>
                <td>{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</td>
                <td>
                  <button className="view-btn" onClick={() => viewOrderDetails(order._id)}>
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
              <h3>Order Details (ID: {currentOrderDetail._id.substring(0, 8)}...)</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="order-status-section">
                <div className="current-status">
                  <strong>Current Status:</strong>
                  <span className={`status-badge status-${currentOrderDetail.status?.replace(/\s+/g, '-') || 'unknown'}`}>
                    {currentOrderDetail.status
                      ? currentOrderDetail.status.charAt(0).toUpperCase() + currentOrderDetail.status.slice(1)
                      : 'Unknown'}
                  </span>
                </div>
                <button className="update-status-btn" onClick={openDirectStatusUpdate}>
                  Update Status
                </button>
              </div>

              <h4>Customer Information</h4>
              <p>
                <strong>Customer ID:</strong>{' '}
                {typeof currentOrderDetail.userId === 'string'
                  ? currentOrderDetail.userId.substring(0, 8) + '...'
                  : currentOrderDetail.userId?._id
                  ? currentOrderDetail.userId._id.substring(0, 8) + '...'
                  : 'Unknown'}
              </p>
              <p>
                <strong>Customer Name:</strong>{' '}
                {customerName ||
                  (typeof currentOrderDetail.userId === 'object' && currentOrderDetail.userId.name
                    ? currentOrderDetail.userId.name
                    : 'Not available')}
              </p>
              <p><strong>Shipping Address:</strong> {currentOrderDetail.shippingAddress || 'Not provided'}</p>
              <p><strong>Billing Address:</strong> {currentOrderDetail.billingAddress || 'Not provided'}</p>

              <h4>Items</h4>
              {currentOrderDetail.items && currentOrderDetail.items.length > 0 ? (
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
                        <td>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No items found for this order.</p>
              )}

              <div className="order-summary">
                <p><strong>Total:</strong> ${currentOrderDetail.total?.toFixed(2) || '0.00'}</p>
                {currentOrderDetail.paymentMethod && (
                  <p><strong>Payment Method:</strong> {currentOrderDetail.paymentMethod}</p>
                )}
                {currentOrderDetail.createdAt && (
                  <p><strong>Order Date:</strong> {formatDate(currentOrderDetail.createdAt)}</p>
                )}
              </div>

              {deliveryInfo ? (
                <div className="delivery-info-section">
                  <h4>Delivery Information</h4>
                  <p><strong>Status:</strong> {deliveryInfo.status}</p>
                  <p><strong>Tracking Number:</strong> {deliveryInfo.trackingNumber || 'Not available'}</p>
                  <p><strong>Carrier:</strong> {deliveryInfo.carrier || 'Not specified'}</p>
                  <p>
                    <strong>Estimated Delivery:</strong>{' '}
                    {deliveryInfo.estimatedDeliveryDate ? formatDate(deliveryInfo.estimatedDeliveryDate) : 'Not set'}
                  </p>
                  {deliveryInfo.deliveryNotes && <p><strong>Notes:</strong> {deliveryInfo.deliveryNotes}</p>}
                </div>
              ) : (
                <div className="no-delivery-info">
                  <p>No delivery record created yet.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {currentOrderDetail.status === 'paid' && !deliveryInfo && (
                <button className="ready-shipment-btn" onClick={createDeliveryRecord}>
                  Mark Ready for Shipment
                </button>
              )}

              {deliveryInfo && (
                <button className="update-status-btn secondary" onClick={updateDeliveryStatusRecord}>
                  Update Delivery Status
                </button>
              )}

              <button className="close-modal-btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Status Update Modal */}
      {showDirectStatusUpdate && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Order Status</h3>
              <button className="close-btn" onClick={() => setShowDirectStatusUpdate(false)}>×</button>
            </div>

            <div className="modal-body">
              <p>
                Current Status: <strong>{currentOrderDetail.status || 'Unknown'}</strong>
              </p>
              <div className="form-group">
                <label htmlFor="new-status">Select New Status:</label>
                <select
                  id="new-status"
                  value={newStatus}
                  onChange={(e) => {
                    console.log('Selected status:', e.target.value);
                    setNewStatus(e.target.value);
                  }}
                  className="status-select"
                >
                  <option value="">Select a status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="ready for shipment">Ready for Shipment</option>
                  <option value="shipped">Shipped</option>
                  <option value="in transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="status-note">
                <p>
                  <strong>Note:</strong> Updating the status will also update any associated delivery records for
                  applicable statuses.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="update-btn" onClick={handleDirectStatusUpdate} disabled={!newStatus}>
                Update Status
              </button>
              <button className="cancel-btn" onClick={() => setShowDirectStatusUpdate(false)}>
                Cancel
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
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingNumber: e.target.value })}
                  placeholder="Enter tracking number"
                />
              </div>

              <div className="form-group">
                <label>Carrier</label>
                <select
                  value={trackingInfo.carrier}
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, carrier: e.target.value })}
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
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, estimatedDeliveryDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={trackingInfo.notes}
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, notes: e.target.value })}
                  placeholder="Add any special delivery instructions or notes"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="create-btn"
                onClick={handleCreateDelivery}
                disabled={!trackingInfo.trackingNumber || !trackingInfo.carrier}
              >
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
              <p>
                Current Status: <strong>{deliveryInfo?.status || 'Unknown'}</strong>
              </p>
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
                  <button className="status-btn shipped-btn" onClick={() => handleStatusUpdate('shipped')}>
                    Shipped
                  </button>
                )}

                {deliveryInfo?.status !== 'in transit' && (
                  <button className="status-btn transit-btn" onClick={() => handleStatusUpdate('in transit')}>
                    In Transit
                  </button>
                )}

                {deliveryInfo?.status !== 'delivered' && (
                  <button className="status-btn delivered-btn" onClick={() => handleStatusUpdate('delivered')}>
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