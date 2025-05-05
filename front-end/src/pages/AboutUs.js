// pages/AboutUs.js
import React, { useState, useEffect } from "react";
import NavigationBar from "../components/NavigationBar";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/AboutUsSpiced.css"; // Import new spiced CSS
import axios from "axios";

const AboutUs = () => {
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
    <div className="about-spiced-container">
      <NavigationBar userData={userData} />
      <div className="about-spiced-content">
        <h2 className="about-spiced-title">About Us</h2>
        <p className="about-spiced-text">
          Welcome to SpiceSense! We are passionate about bringing the finest spices from around the world to your kitchen. 
          Our mission is to provide high-quality, authentic spices that enhance your culinary experience. 
          Founded by a team of spice enthusiasts, we work directly with suppliers to ensure freshness and sustainability.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;