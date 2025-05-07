import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchOrder, updateOrder, deleteOrder } from '../api';
import "../Styles/OrderConfirmationPage.css"; 
import NavigationBar from "../components/NavigationBar";
import axios from "axios";

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");
  const [userData, setUserData] = useState(null);
  const location = useLocation();


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const passedUserData = location.state?.userData;
        if (passedUserData) {
          setUserData(passedUserData);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/user/data", {
          withCredentials: true,
        });

        if (response.data.success) {
          setUserData(response.data.userData);
        } else {
          setError(response.data.message);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data?.message || error.message);
        setError("Failed to load user data. Please log in again.");
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate, location.state]);

  useEffect(() => {
    setIsLoading(true);
    fetchOrder(orderId)
      .then((res) => {
        console.log('Fetched order:', JSON.stringify(res.data, null, 2));
        setOrder(res.data);
        setError('');
      })
      .catch((err) => {
        console.error('Error fetching order:', err.response?.data || err.message);
        setError('Failed to load order details. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderId]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
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
      setError(`Failed to update order: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Update order status to "paid" using the updateOrder function from api.js
      const updatedOrderData = {
        status: 'pending'
      };
      
      const response = await updateOrder(orderId, updatedOrderData);
      console.log('Order confirmed:', response.data);
      
      // Update local state to reflect the change
      setOrder({ ...order, status: 'paid' });
      
      alert('Order confirmed successfully!');
      
      // Navigate to delivery tracking with order ID
      navigate(`/delivery-tracking/${orderId}`);
      
    } catch (err) {
      console.error('Error confirming order:', err);
      setError(`Failed to confirm order: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setIsLoading(true);
      setError('');
      try {
        await deleteOrder(orderId);
        alert('Order canceled successfully!');
        navigate('/home');
      } catch (err) {
        console.error('Error deleting order:', err);
        setError('Failed to cancel order. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewDeliveries = () => {
    // Navigate directly to delivery tracking for this order
    navigate(`/delivery-tracking/${orderId}`);
  };

  const handleQuantityChange = (index, value) => {
    const updatedItems = [...order.items];
    updatedItems[index].quantity = parseInt(value) || 1;
    setOrder({ ...order, items: updatedItems });
  };

  if (isLoading && !order) return <p className="order-confirmation-loading">Loading...</p>;

  return (
    <div>
      <NavigationBar  userData={userData}/>
      <div className="order-confirmation-container">
        <h2 className="order-confirmation-title">Order Confirmation</h2>
        
        {error && (
          <div className="order-confirmation-error">
            <p>{error}</p>
          </div>
        )}
        
        {!order ? (
          <p>Order details not available. Please try again later.</p>
        ) : isEditing ? (
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
              <button onClick={handleSave} className="order-confirmation-save-btn" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </button>
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
              <button onClick={handleEdit} className="order-confirmation-edit-btn" disabled={isLoading || order.status === 'paid'}>
                {order.status === 'paid' ? 'Cannot Edit' : 'Edit'}
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={isLoading || order.status === 'paid'}
                className="order-confirmation-confirm-btn"
              >
                {isLoading ? 'Processing...' : order.status === 'paid' ? 'Order Confirmed' : 'Confirm Order'}
              </button>
              <button 
                onClick={handleCancel} 
                disabled={isLoading || order.status === 'paid'} 
                className="order-confirmation-cancel-btn"
              >
                {order.status === 'paid' ? 'Cannot Cancel' : 'Cancel Order'}
              </button>
            </div>
            
            {order.status === 'paid' && (
              <div className="order-confirmation-next-steps">
                <p>Your order has been confirmed. You can now track your delivery status.</p>
                <button 
                  onClick={handleViewDeliveries} 
                  className="order-confirmation-view-deliveries-btn"
                >
                  Track Your Order
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmationPage;