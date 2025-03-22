import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';



const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:5000/api/order/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(console.error);
  }, [orderId]);

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => setIsEditing(false); // Implement update logic if needed

  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h2>Order Confirmation</h2>
      {isEditing ? (
        <>
          <input type="text" value={order.shippingAddress} onChange={(e) => setOrder({ ...order, shippingAddress: e.target.value })} />
          <input type="text" value={order.billingAddress} onChange={(e) => setOrder({ ...order, billingAddress: e.target.value })} />
          <button onClick={handleSave}>Save</button>
        </>
      ) : (
        <>
          <p>Shipping Address: {order.shippingAddress}</p>
          <p>Billing Address: {order.billingAddress}</p>
          <p>Total: ${order.total}</p>
          <button onClick={handleEdit}>Edit</button>
          <button onClick={() => navigate('/home')}>Confirm</button>
        </>
      )}
    </div>
  );
};

export default OrderConfirmationPage;
