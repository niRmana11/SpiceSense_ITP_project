import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateOrder, deleteOrder } from '../api'; // Import API functions
import axios from 'axios'; // Still needed for the initial GET request

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/order/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch((err) => console.error('Error fetching order:', err));
  }, [orderId]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    try {
      const updatedOrder = {
        items: order.items.map((item) => ({
          itemId: item.itemId._id,
          quantity: item.quantity,
        })),
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
      };

      const response = await updateOrder(orderId, updatedOrder); // Use updateOrder from api.js
      setOrder(response.data.order); // Update state with the latest order data
      setIsEditing(false);
      alert('Order updated successfully!');
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order');
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await deleteOrder(orderId); // Use deleteOrder from api.js
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
    updatedItems[index].quantity = parseInt(value) || 1; // Default to 1 if invalid
    setOrder({ ...order, items: updatedItems });
  };

  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h2>Order Confirmation</h2>
      {isEditing ? (
        <>
          <h3>Edit Order</h3>
          {order.items.map((item, index) => (
            <div key={item.itemId._id}>
              <p>Item: {item.itemId.name}</p>
              <label>Quantity:</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                min="1"
              />
            </div>
          ))}
          <label>Shipping Address:</label>
          <input
            type="text"
            value={order.shippingAddress}
            onChange={(e) => setOrder({ ...order, shippingAddress: e.target.value })}
          />
          <label>Billing Address:</label>
          <input
            type="text"
            value={order.billingAddress}
            onChange={(e) => setOrder({ ...order, billingAddress: e.target.value })}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel Edit</button>
        </>
      ) : (
        <>
          <h3>Order Details</h3>
          {order.items.map((item) => (
            <p key={item.itemId._id}>
              Item: {item.itemId.name} - Quantity: {item.quantity} - Price: ${item.price}
            </p>
          ))}
          <p>Shipping Address: {order.shippingAddress}</p>
          <p>Billing Address: {order.billingAddress}</p>
          <p>Total: ${order.total}</p>
          <button onClick={handleEdit}>Edit</button>
          <button onClick={() => navigate('/home')}>Confirm</button>
          <button onClick={handleCancel}>Cancel Order</button>
        </>
      )}
    </div>
  );
};

export default OrderConfirmationPage;