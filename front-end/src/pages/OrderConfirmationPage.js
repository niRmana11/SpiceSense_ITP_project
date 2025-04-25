// pages/OrderConfirmationPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for direct API call
import { fetchOrder, updateOrder, deleteOrder } from '../api';
import "../Styles/OrderConfirmationPage.css"; 
import NavigationBar from "../components/NavigationBar";

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder(orderId)
      .then((res) => {
        console.log('Fetched order:', JSON.stringify(res.data, null, 2));
        setOrder(res.data);
      })
      .catch((err) => console.error('Error fetching order:', err.response?.data || err.message));
  }, [orderId]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    try {
      console.log('Current order.items:', JSON.stringify(order.items, null, 2));

      const updatedOrder = {
        items: order.items.map((item) => {
          const itemId = item.itemId?._id || item.itemId;
          if (!itemId) {
            throw new Error('Item ID is missing in order data');
          }
          return {
            itemId,
            quantity: item.quantity,
          };
        }),
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
      };

      console.log('Order ID:', orderId);
      console.log('Updated order data being sent:', JSON.stringify(updatedOrder, null, 2));

      const response = await updateOrder(orderId, updatedOrder);
      console.log('Update response:', response.data);
      setOrder(response.data.order);
      setIsEditing(false);
      alert('Order updated successfully!');
    } catch (err) {
      console.error('Error updating order:', err.response?.data || err.message);
      alert(`Failed to update order: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Step 1: Update order status to "paid"
      const orderResponse = await axios.put(`http://localhost:5000/api/order/${orderId}`, {
        status: 'paid'
      });
      
      console.log('Order confirmed:', orderResponse.data);
      
      // Step 2: Create a delivery record for this order
      const deliveryData = {
        orderId: orderId,
        status: 'ready for shipment',
        // You can add default values for tracking if needed
        trackingNumber: '',
        carrier: '',
        estimatedDeliveryDate: '',
        deliveryNotes: 'Order automatically processed'
      };
      
      const deliveryResponse = await axios.post('http://localhost:5000/api/deliveries/create', deliveryData);
      
      console.log('Delivery created:', deliveryResponse.data);
      
      // Step 3: Redirect to the specific delivery tracking page
      const deliveryId = deliveryResponse.data.delivery._id;
      alert('Order confirmed successfully! Redirecting to delivery tracking...');
      
      // Navigate to the delivery tracking page with the new delivery ID
      navigate(`/delivery-tracking/${deliveryId}`);
      
    } catch (err) {
      console.error('Error confirming order:', err.response?.data || err.message);
      
      // Check if we already have a delivery for this order
      try {
        const deliveryCheckResponse = await axios.get(`http://localhost:5000/api/deliveries/order/${orderId}`);
        if (deliveryCheckResponse.data && deliveryCheckResponse.data._id) {
          // If a delivery already exists, just redirect to it
          navigate(`/delivery-tracking/${deliveryCheckResponse.data._id}`);
          return;
        }
      } catch (deliveryErr) {
        // If no delivery exists, show the error
        alert(`Failed to confirm order: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await deleteOrder(orderId);
        alert('Order canceled successfully!');
        navigate('/home');
      } catch (err) {
        console.error('Error deleting order:', err);
        alert('Failed to cancel order');
      }
    }
  };

  const handleQuantityChange = (index, value) => {
    const updatedItems = [...order.items];
    updatedItems[index].quantity = parseInt(value) || 1;
    setOrder({ ...order, items: updatedItems });
  };

  if (!order) return <p className="order-confirmation-loading">Loading...</p>;

  return (
    <div> <NavigationBar />
    <div className="order-confirmation-container">
      <h2 className="order-confirmation-title">Order Confirmation</h2>
      {isEditing ? (
        <div className="order-confirmation-edit-section">
          <h3 className="order-confirmation-subtitle">Edit Order</h3>
          {order.items.map((item, index) => (
            <div key={item.itemId?._id || item.itemId} className="order-confirmation-item-edit">
              <p className="order-confirmation-item-name">Item: {item.itemId?.name || 'Unknown Item'}</p>
              <label className="order-confirmation-label">Quantity:</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                min="1"
                className="order-confirmation-input"
              />
            </div>
          ))}
          <div className="order-confirmation-form-group">
            <label className="order-confirmation-label">Shipping Address:</label>
            <input
              type="text"
              value={order.shippingAddress}
              onChange={(e) => setOrder({ ...order, shippingAddress: e.target.value })}
              className="order-confirmation-input"
            />
          </div>
          <div className="order-confirmation-form-group">
            <label className="order-confirmation-label">Billing Address:</label>
            <input
              type="text"
              value={order.billingAddress}
              onChange={(e) => setOrder({ ...order, billingAddress: e.target.value })}
              className="order-confirmation-input"
            />
          </div>
          <div className="order-confirmation-edit-buttons">
            <button onClick={handleSave} className="order-confirmation-save-btn">Save</button>
            <button onClick={() => setIsEditing(false)} className="order-confirmation-cancel-edit-btn">Cancel Edit</button>
          </div>
        </div>
      ) : (
        <div className="order-confirmation-details-section">
          <h3 className="order-confirmation-subtitle">Order Details</h3>
          {order.items.map((item) => (
            <p key={item.itemId?._id || item.itemId} className="order-confirmation-item">
              Item: {item.itemId?.name || 'Unknown Item'} - Quantity: {item.quantity} - Price: ${item.price}
            </p>
          ))}
          <p className="order-confirmation-detail">Shipping Address: {order.shippingAddress}</p>
          <p className="order-confirmation-detail">Billing Address: {order.billingAddress}</p>
          <p className="order-confirmation-detail">Total: ${order.total}</p>
          <div className="order-confirmation-status">
            <p>Status: <span className={`status-${order.status}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
          </div>
          <div className="order-confirmation-buttons">
            <button onClick={handleEdit} className="order-confirmation-edit-btn">Edit</button>
            <button 
              onClick={handleConfirm} 
              disabled={isLoading || order.status === 'paid'}
              className="order-confirmation-confirm-btn"
            >
              {isLoading ? 'Processing...' : order.status === 'paid' ? 'Order Confirmed' : 'Confirm Order'}
            </button>
            <button onClick={handleCancel} className="order-confirmation-cancel-btn">Cancel Order</button>
          </div>
          
          {order.status === 'paid' && (
            <div className="order-confirmation-next-steps">
              <p>Your order has been confirmed. You can now track your delivery status.</p>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
};





export default OrderConfirmationPage;

