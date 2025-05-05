// pages/ContactUs.js
import React, { useState, useEffect } from "react";
import NavigationBar from "../components/NavigationBar";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/ContactUsSpiced.css"; // Import new spiced CSS
import axios from "axios";

const ContactUs = () => {
    const userId = sessionStorage.getItem("userId");
        const [userData, setUserData] = useState(null);
        const [error, setError] = useState(null);
        const navigate = useNavigate();
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