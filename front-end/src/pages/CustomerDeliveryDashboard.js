// pages/CustomerDeliveryDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import NavigationBar from "../components/NavigationBar";
import "../Styles/DeliveryDashboard.css";

const CustomerDeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  
  // Get user ID from session storage
  const userId = sessionStorage.getItem("userId");

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
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        
        // Instead of fetching deliveries, fetch orders for this user
        const response = await axios.get(`http://localhost:5000/api/order`);
        
        // Filter to only include paid orders (which are potentially being delivered)
        const paidOrders = response.data.filter(order => order.status === 'paid');
        setOrders(paidOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Unable to load order information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchOrders();
    } else {
      setError('Please log in to view your orders');
      navigate('/login');
    }
  }, [userId, navigate]);

  // Map order status to delivery status
  const getDeliveryStatus = (order) => {
    const orderDate = new Date(order.createdAt || Date.now());
    const currentDate = new Date();
    const daysSinceOrder = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
    
    // Simulate delivery status based on order age
    if (daysSinceOrder < 1) {
      return 'ready for shipment';
    } else if (daysSinceOrder < 3) {
      return 'shipped';
    } else if (daysSinceOrder < 5) {
      return 'in transit';
    } else {
      return 'delivered';
    }
  };

  // Create virtual delivery objects from orders
  const deliveries = orders.map(order => ({
    _id: order._id,
    orderId: order._id,
    status: getDeliveryStatus(order),
    trackingNumber: `TRK${order._id.substring(0, 8).toUpperCase()}`,
    carrier: 'Express Shipping',
    estimatedDeliveryDate: (() => {
      const date = new Date(order.createdAt || Date.now());
      date.setDate(date.getDate() + 7); // Estimated delivery in 7 days
      return date;
    })(),
    createdAt: order.createdAt,
    shippingAddress: order.shippingAddress,
    deliveryNotes: 'Your order is being processed'
  }));

  // Filter deliveries based on selected status
  const filteredDeliveries = statusFilter === 'all' 
    ? deliveries 
    : deliveries.filter(delivery => delivery.status === statusFilter);

  // Function to get appropriate status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'ready for shipment':
        return 'status-badge-ready';
      case 'shipped':
        return 'status-badge-shipped';
      case 'in transit':
        return 'status-badge-transit';
      case 'delivered':
        return 'status-badge-delivered';
      default:
        return 'status-badge-default';
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div>
      <NavigationBar userData={userData}/>
      <div className="delivery-dashboard-container">
        <h2 className="delivery-dashboard-title">My Orders & Deliveries</h2>
        
        {/* Status filter buttons */}
        <div className="delivery-status-filters">
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'ready for shipment' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('ready for shipment')}
          >
            Ready for Shipment
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('shipped')}
          >
            Shipped
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'in transit' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('in transit')}
          >
            In Transit
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('delivered')}
          >
            Delivered
          </button>
        </div>

        {/* Loading and error states */}
        {isLoading ? (
          <div className="delivery-loading">Loading your order information...</div>
        ) : error ? (
          <div className="delivery-error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="no-deliveries">
            <p>You have no orders in progress.</p>
            <button 
              className="shop-now-btn"
              onClick={() => navigate('/home')}
            >
              Shop Now
            </button>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="no-deliveries">
            <p>No orders found with the selected status.</p>
          </div>
        ) : (
          <div className="deliveries-list">
            {filteredDeliveries.map(delivery => (
              <div key={delivery._id} className="delivery-card">
                <div className="delivery-header">
                  <h3>Order #{delivery.orderId}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(delivery.status)}`}>
                    {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                  </span>
                </div>
                
                <div className="delivery-details">
                  <div className="delivery-info">
                    <p><strong>Order Date:</strong> {formatDate(delivery.createdAt)}</p>
                    <p><strong>Tracking Number:</strong> {delivery.trackingNumber || 'Not available yet'}</p>
                    <p><strong>Carrier:</strong> {delivery.carrier || 'Not assigned yet'}</p>
                    <p><strong>Estimated Delivery:</strong> {formatDate(delivery.estimatedDeliveryDate)}</p>
                    <p><strong>Shipping To:</strong> {delivery.shippingAddress}</p>
                  </div>
                  
                  <div className="delivery-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => navigate(`/delivery-tracking/${delivery.orderId}`)}
                    >
                      Track Order
                    </button>
                  </div>
                </div>
                
                {delivery.deliveryNotes && (
                  <div className="delivery-notes">
                    <p><strong>Notes:</strong> {delivery.deliveryNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDeliveryDashboard;