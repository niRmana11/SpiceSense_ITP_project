import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrder, updateOrder, deleteOrder } from '../api';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
          const itemId = item.itemId?._id || item.itemId; // Fallback to itemId if not populated
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

  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h2>Order Confirmation</h2>
      {isEditing ? (
        <>
          <h3>Edit Order</h3>
          {order.items.map((item, index) => (
            <div key={item.itemId?._id || item.itemId}>
              <p>Item: {item.itemId?.name || 'Unknown Item'}</p>
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
            <p key={item.itemId?._id || item.itemId}>
              Item: {item.itemId?.name || 'Unknown Item'} - Quantity: {item.quantity} - Price: ${item.price}
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