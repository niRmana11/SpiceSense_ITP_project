import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createOrder } from '../api';
import NavigationBar from "../components/NavigationBar";
import '../Styles/OrderProcessing.css';
import axios from "axios";

const OrderProcessingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId") || '';
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
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
  
  // Initialize form with default values
  const [form, setForm] = useState({
    quantity: 1,
    shippingAddress: '',
    billingAddress: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!userId) {
      // Redirect to login page if userId is not available
      navigate('/login', { state: { redirect: `/order/${id}` } });
    }
  }, [userId, navigate, id]);

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
    const { name, value, type } = e.target;
    // Handle different input types appropriately
    const updatedValue = type === 'number' ? parseInt(value, 10) || 1 : value;
    
    setForm(prevForm => ({ ...prevForm, [name]: updatedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the order data according to API requirements
      const orderData = {
        userId: userId,
        items: [{ 
          itemId: id, 
          quantity: parseInt(form.quantity, 10) 
        }],
        shippingAddress: form.shippingAddress,
        billingAddress: form.billingAddress
      };

      console.log('Sending order data:', orderData); // Debug log

      const response = await createOrder(orderData);
      
      if (response && response.data && response.data.order) {
        navigate(`/confirm/${response.data.order._id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      let errorMessage = 'Failed to place order. Please try again.';
      
      // Handle specific error responses from the API
      if (error.response) {
        console.log('Error response:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      }
      
      setErrors(prevErrors => ({ ...prevErrors, submit: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <NavigationBar userData={userData} />
      <div className="order-container">
        <h2>Order Processing</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="quantity">Quantity:</label>
            <input
              id="quantity"
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              min="1"
              className={errors.quantity ? 'input-error' : ''}
            />
            {errors.quantity && <span className="error-message">{errors.quantity}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="shippingAddress">Shipping Address:</label>
            <textarea
              id="shippingAddress"
              name="shippingAddress"
              value={form.shippingAddress}
              onChange={handleChange}
              className={errors.shippingAddress ? 'input-error' : ''}
              rows="3"
            />
            {errors.shippingAddress && <span className="error-message">{errors.shippingAddress}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="billingAddress">Billing Address:</label>
            <textarea
              id="billingAddress"
              name="billingAddress"
              value={form.billingAddress}
              onChange={handleChange}
              className={errors.billingAddress ? 'input-error' : ''}
              rows="3"
            />
            {errors.billingAddress && <span className="error-message">{errors.billingAddress}</span>}
          </div>



          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderProcessingPage;