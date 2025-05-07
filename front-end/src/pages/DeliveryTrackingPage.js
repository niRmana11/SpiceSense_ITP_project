// pages/DeliveryTrackingPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchOrder } from '../api'; // Use the existing API function
import NavigationBar from "../components/NavigationBar";
import "../Styles/DeliveryTracking.css";
import axios from "axios";

const DeliveryTrackingPage = () => {
  const { deliveryId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");
  const [userData, setUserData] = useState(null);

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
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        
        // Get orderId from params or from query string
        let orderId = null;
        
        // Try to get orderId from URL params or query string
        if (deliveryId) {
          // Use deliveryId as orderId directly
          orderId = deliveryId;
        } else {
          // Check if orderId is in the query parameters
          const searchParams = new URLSearchParams(location.search);
          orderId = searchParams.get('orderId');
        }
        
        if (!orderId) {
          setError('No order ID provided');
          setIsLoading(false);
          return;
        }
        
        // Use the fetchOrder function from your API
        const response = await fetchOrder(orderId);
        
        if (response.data) {
          setOrder(response.data);
          setError(null);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Unable to load tracking information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [deliveryId, location.search]);

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Function to determine the current step in the delivery process
  const getCurrentStep = (status) => {
    if (!status) return 0;
    
    switch(status.toLowerCase()) {
      case 'ready for shipment':
        return 1;
      case 'shipped':
        return 2;
      case 'in transit':
        return 3;
      case 'delivered':
        return 4;
      case 'paid':
        return 1; // If the order is paid but no delivery status, assume "ready for shipment"
      default:
        return 0;
    }
  };

  // Generate estimated dates based on order date
  const getEstimatedDates = () => {
    if (!order) return {};
    
    const orderDate = new Date(order.createdAt || Date.now());
    
    // Processing: 1-2 days
    const processingDate = new Date(orderDate);
    processingDate.setDate(orderDate.getDate() + 1);
    
    // Shipping: 3-5 days after processing
    const shippingDate = new Date(processingDate);
    shippingDate.setDate(processingDate.getDate() + 2);
    
    // Delivery: 2-7 days after shipping
    const deliveryDate = new Date(shippingDate);
    deliveryDate.setDate(shippingDate.getDate() + 5);
    
    return {
      orderDate,
      processingDate,
      shippingDate,
      deliveryDate
    };
  };

  if (isLoading) {
    return (
      <div>
        <NavigationBar userData={userData} />
        <div className="delivery-tracking-container">
          <div className="delivery-tracking-loading">Loading tracking information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <NavigationBar userData={userData} />
        <div className="delivery-tracking-container">
          <div className="delivery-tracking-error">{error}</div>
          <button onClick={() => navigate('/home')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <NavigationBar userData={userData} />
        <div className="delivery-tracking-container">
          <div className="delivery-tracking-error">Order information not found.</div>
          <button onClick={() => navigate('/home')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStep(order.status);
  const estimatedDates = getEstimatedDates();

  return (
    <div>
      <NavigationBar userData={userData}/>
      <div className="delivery-tracking-container">
        <h2 className="delivery-tracking-title">Order Tracking</h2>
        
        <div className="delivery-tracking-summary">
          <div className="delivery-tracking-info">
            <p><strong>Order Number:</strong> {order._id}</p>
            <p><strong>Status:</strong> <span className={`status-${(order.status || '').replace(/\s+/g, '-')}`}>
              {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Processing'}
            </span></p>
            <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
            <p><strong>Estimated Processing:</strong> {formatDate(estimatedDates.processingDate)}</p>
            <p><strong>Estimated Shipping:</strong> {formatDate(estimatedDates.shippingDate)}</p>
            <p><strong>Estimated Delivery:</strong> {formatDate(estimatedDates.deliveryDate)}</p>
          </div>
        </div>
        
        {/* Delivery Progress Tracker */}
        <div className="delivery-tracking-progress">
          <div className="progress-steps">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-icon">1</div>
              <div className="step-label">Order Processing</div>
              <div className="step-date">{formatDate(estimatedDates.processingDate)}</div>
            </div>
            
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-icon">2</div>
              <div className="step-label">Shipped</div>
              <div className="step-date">Estimated: {formatDate(estimatedDates.shippingDate)}</div>
            </div>
            
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-icon">3</div>
              <div className="step-label">In Transit</div>
              <div className="step-date">Pending</div>
            </div>
            
            <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-icon">4</div>
              <div className="step-label">Delivered</div>
              <div className="step-date">Estimated: {formatDate(estimatedDates.deliveryDate)}</div>
            </div>
          </div>
          
          <div className="progress-bar">
            <div className="progress-indicator" style={{ width: `${(currentStep - 1) * 33.33}%` }}></div>
          </div>
        </div>
        
        {/* Order Details */}
        <div className="delivery-order-details">
          <h3>Order Details</h3>
          <div className="order-items">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <p><strong>Item:</strong> {item.itemId?.name || `Item ${index + 1}`}</p>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p><strong>Price:</strong> ${item.price?.toFixed(2) || '0.00'}</p>
              </div>
            ))}
          </div>
          <div className="order-total">
            <p><strong>Total:</strong> ${order.total?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        
        {/* Shipping Information */}
        <div className="shipping-information">
          <h3>Shipping Information</h3>
          <p><strong>Shipping Address:</strong> {order.shippingAddress}</p>
          <p className="info-message">Tracking information will be available once your order ships.</p>
        </div>
        
        <div className="delivery-tracking-actions">
          <button onClick={() => navigate('/home')} className="back-button">
            Back to Home
          </button>
          <button onClick={() => window.print()} className="action-button">
            Print Order Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingPage;