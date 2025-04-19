// pages/ContactUs.js
import React from "react";
import NavigationBar from "../components/NavigationBar";
import { useLocation } from "react-router-dom";
import "../Styles/ContactUsSpiced.css"; // Import new spiced CSS

const ContactUs = () => {
  const location = useLocation();
  const userData = location.state?.userData;

  return (
    <div className="contact-spiced-container">
      <NavigationBar userData={userData} />
      <div className="contact-spiced-content">
        <h2 className="contact-spiced-title">Contact Us</h2>
        <div className="contact-spiced-info">
          <p className="contact-spiced-text">
            Have questions or need assistance? Reach out to us!
          </p>
          <p className="contact-spiced-detail"><strong>Email:</strong> support@spicesense.com</p>
          <p className="contact-spiced-detail"><strong>Phone:</strong> +1 (555) 123-4567</p>
          <p className="contact-spiced-detail"><strong>Address:</strong> 123 Spice Lane, Flavor Town, USA</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;