// pages/CustomerDeliveryDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavigationBar from "../components/NavigationBar";
import "../Styles/DeliveryDashboard.css"; // You'll need to create this CSS file

const CustomerDeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  
  // Get user ID from session storage
  const userId = sessionStorage.getItem("userId");
  
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setIsLoading(true);
        // This API endpoint would need to be implemented
        const response = await axios.get(`http://localhost:5000/api/deliveries/user/${userId}`);
        setDeliveries(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching deliveries:', err);
        setError('Unable to load delivery information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchDeliveries();
    } else {
      setError('Please log in to view your deliveries');
      navigate('/login');
    }
  }, [userId, navigate]);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div>
      <NavigationBar />
      <div className="delivery-dashboard-container">
        <h2 className="delivery-dashboard-title">My Deliveries</h2>
        
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
          <div className="delivery-loading">Loading your deliveries...</div>
        ) : error ? (
          <div className="delivery-error">{error}</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="no-deliveries">
            <p>No deliveries found with the selected status.</p>
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
                    <p><strong>Tracking Number:</strong> {delivery.trackingNumber || 'Not available yet'}</p>
                    <p><strong>Carrier:</strong> {delivery.carrier || 'Not assigned yet'}</p>
                    <p><strong>Estimated Delivery:</strong> {delivery.estimatedDeliveryDate 
                      ? formatDate(delivery.estimatedDeliveryDate) 
                      : 'Not available yet'}
                    </p>
                    {delivery.actualDeliveryDate && (
                      <p><strong>Delivered On:</strong> {formatDate(delivery.actualDeliveryDate)}</p>
                    )}
                  </div>
                  
                  <div className="delivery-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => navigate(`/delivery-tracking/${delivery._id}`)}
                    >
                      View Details
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