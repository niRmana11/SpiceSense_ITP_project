import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createOrder } from '../api';
import NavigationBar from "../components/NavigationBar";
import '../Styles/OrderProcessing.css';

const userId = sessionStorage.getItem("userId");  

const OrderProcessingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userId: userId,
    quantity: 1,
    shippingAddress: '',
    billingAddress: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let tempErrors = {};
    
    // Quantity validation
    if (!form.quantity || form.quantity < 1) {
      tempErrors.quantity = 'Quantity must be at least 1';
    }

    // Shipping Address validation
    if (!form.shippingAddress.trim()) {
      tempErrors.shippingAddress = 'Shipping address is required';
    } else if (form.shippingAddress.length < 5) {
      tempErrors.shippingAddress = 'Shipping address must be at least 5 characters';
    }

    // Billing Address validation
    if (!form.billingAddress.trim()) {
      tempErrors.billingAddress = 'Billing address is required';
    } else if (form.billingAddress.length < 5) {
      tempErrors.billingAddress = 'Billing address must be at least 5 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async () => {
    if (validateForm()) {
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
        setErrors({ ...errors, submit: 'Failed to place order. Please try again.' });
      }
    }
  };

  return (
    <div>
      <NavigationBar />
      <div style={{ maxWidth: '400px', margin: '20px auto' }}>
        <h2>Order Processing</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Quantity:</label>
          <input 
            type="number" 
            name="quantity" 
            value={form.quantity} 
            onChange={handleChange}
            min="1"
            style={{ width: '100%', padding: '5px' }}
          />
          {errors.quantity && <span style={{ color: 'red', fontSize: '12px' }}>{errors.quantity}</span>}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Shipping Address:</label>
          <input 
            type="text" 
            name="shippingAddress" 
            value={form.shippingAddress} 
            onChange={handleChange}
            style={{ width: '100%', padding: '5px' }}
          />
          {errors.shippingAddress && <span style={{ color: 'red', fontSize: '12px' }}>{errors.shippingAddress}</span>}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Billing Address:</label>
          <input 
            type="text" 
            name="billingAddress" 
            value={form.billingAddress} 
            onChange={handleChange}
            style={{ width: '100%', padding: '5px' }}
          />
          {errors.billingAddress && <span style={{ color: 'red', fontSize: '12px' }}>{errors.billingAddress}</span>}
        </div>

        {errors.submit && <div style={{ color: 'red', marginBottom: '15px' }}>{errors.submit}</div>}

        <button 
          onClick={handleSubmit}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default OrderProcessingPage;