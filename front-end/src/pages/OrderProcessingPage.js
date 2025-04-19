import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createOrder } from '../api';
import NavigationBar from "../components/NavigationBar";


//const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage
const userId = sessionStorage.getItem("userId");  //get user id from sessionStorage

const OrderProcessingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userId: userId, // Replace with actual user ID
    quantity: 1,
    shippingAddress: '',
    billingAddress: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const orderData = {
        userId: form.userId,
        items: [{ itemId: id, quantity: form.quantity }],
        shippingAddress: form.shippingAddress,
        billingAddress: form.billingAddress
      };


      const response = await createOrder(orderData);
      navigate(`/confirm/${response.data.order._id}`);
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  return (
    <div>
            <NavigationBar />
    <div>
      <h2>Order Processing</h2>
      <label>Quantity:</label>
      <input type="number" name="quantity" value={form.quantity} onChange={handleChange} />

      <label>Shipping Address:</label>
      <input type="text" name="shippingAddress" value={form.shippingAddress} onChange={handleChange} />

      <label>Billing Address:</label>
      <input type="text" name="billingAddress" value={form.billingAddress} onChange={handleChange} />

      <button onClick={handleSubmit}>Place Order</button>
    </div>
    </div>
  );
};

export default OrderProcessingPage;
