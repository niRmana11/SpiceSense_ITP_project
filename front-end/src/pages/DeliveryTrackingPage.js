// pages/DeliveryTrackingPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavigationBar from "../components/NavigationBar";
import "../Styles/DeliveryTracking.css"; // You'll need to create this CSS file

const DeliveryTrackingPage = () => {
  const { deliveryId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  
    
    


  useEffect(() => {   
    const fetchDeliveryAndOrder = async () => {
      try {
        setIsLoading(true);
        // Fetch delivery details
        const deliveryResponse = await axios.get(`http://localhost:5000/api/deliveries/${deliveryId}`);
        setDelivery(deliveryResponse.data);
        
        // Fetch associated order details
        const orderResponse = await axios.get(`http://localhost:5000/api/order/${deliveryResponse.data.orderId}`);
        setOrder(orderResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching delivery details:', err);
        setError('Unable to load delivery tracking information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (deliveryId) {
      fetchDeliveryAndOrder();
    }
  }, [deliveryId]);

  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Function to determine the current step in the delivery process
  const getCurrentStep = (status) => {
    switch(status) {
      case 'ready for shipment':
        return 1;
      case 'shipped':
        return 2;
      case 'in transit':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div>
        <NavigationBar />
        <div className="delivery-tracking-container">
          <div className="delivery-tracking-loading">Loading tracking information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <NavigationBar />
        <div className="delivery-tracking-container">
          <div className="delivery-tracking-error">{error}</div>
          <button onClick={() => navigate('/deliveries')} className="back-button">
            Back to Deliveries
          </button>
        </div>
      </div>
    );
  }

  if (!delivery || !order) {
    return (
      <div>
        <NavigationBar />
        <div className="delivery-tracking-container">
          <div className="delivery-tracking-error">Delivery information not found.</div>
          <button onClick={() => navigate('/deliveries')} className="back-button">
            Back to Deliveries
          </button>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStep(delivery.status);

  return (
    <div>
      <NavigationBar />
      <div className="delivery-tracking-container">
        <h2 className="delivery-tracking-title">Delivery Tracking</h2>
        
        <div className="delivery-tracking-summary">
          <div className="delivery-tracking-info">
            <p><strong>Order Number:</strong> {order._id}</p>
            <p><strong>Status:</strong> <span className={`status-${delivery.status.replace(/\s+/g, '-')}`}>
              {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
            </span></p>
            {delivery.trackingNumber && (
              <p><strong>Tracking Number:</strong> {delivery.trackingNumber}</p>
            )}
            {delivery.carrier && (
              <p><strong>Carrier:</strong> {delivery.carrier}</p>
            )}
            {delivery.estimatedDeliveryDate && (
              <p><strong>Estimated Delivery:</strong> {formatDate(delivery.estimatedDeliveryDate)}</p>
            )}
            {delivery.actualDeliveryDate && (
              <p><strong>Delivered On:</strong> {formatDate(delivery.actualDeliveryDate)}</p>
            )}
          </div>
        </div>
        
        {/* Delivery Progress Tracker */}
        <div className="delivery-tracking-progress">
          <div className="progress-steps">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-icon">1</div>
              <div className="step-label">Order Processing</div>
              <div className="step-date">
                {delivery.statusHistory && delivery.statusHistory.find(h => h.status === 'ready for shipment') 
                  ? formatDate(delivery.statusHistory.find(h => h.status === 'ready for shipment').timestamp)
                  : 'Pending'}
              </div>
            </div>
            
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-icon">2</div>
              <div className="step-label">Shipped</div>
              <div className="step-date">
                {delivery.statusHistory && delivery.statusHistory.find(h => h.status === 'shipped') 
                  ? formatDate(delivery.statusHistory.find(h => h.status === 'shipped').timestamp)
                  : 'Pending'}
              </div>
            </div>
            
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-icon">3</div>
              <div className="step-label">In Transit</div>
              <div className="step-date">
                {delivery.statusHistory && delivery.statusHistory.find(h => h.status === 'in transit') 
                  ? formatDate(delivery.statusHistory.find(h => h.status === 'in transit').timestamp)
                  : 'Pending'}
              </div>
            </div>
            
            <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-icon">4</div>
              <div className="step-label">Delivered</div>
              <div className="step-date">
                {delivery.statusHistory && delivery.statusHistory.find(h => h.status === 'delivered') 
                  ? formatDate(delivery.statusHistory.find(h => h.status === 'delivered').timestamp)
                  : 'Pending'}
              </div>
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
        
        {/* Delivery Notes */}
        {delivery.deliveryNotes && (
          <div className="delivery-notes">
            <h3>Delivery Notes</h3>
            <p>{delivery.deliveryNotes}</p>
          </div>
        )}
        
        {/* Shipping Information */}
        <div className="shipping-information">
          <h3>Shipping Information</h3>
          <p><strong>Shipping Address:</strong> {order.shippingAddress}</p>
          {delivery.carrier && (
            <p><strong>Carrier:</strong> {delivery.carrier}</p>
          )}
          {delivery.trackingNumber && (
            <div className="tracking-link">
              <p><strong>Track your package:</strong></p>
              <p>Use your tracking number {delivery.trackingNumber} on the carrier's website.</p>
            </div>
          )}
        </div>
        
        <div className="delivery-tracking-actions">
          <button onClick={() => navigate('/delivery-tracking')} className="back-button">
            Back to Deliveries
          </button>
          {/* Could add additional actions here like "Contact Support" */}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingPage;