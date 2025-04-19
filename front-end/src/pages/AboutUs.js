// pages/AboutUs.js
import React from "react";
import NavigationBar from "../components/NavigationBar";
import { useLocation } from "react-router-dom";
import "../Styles/AboutUsSpiced.css"; // Import new spiced CSS

const AboutUs = () => {
  const location = useLocation();
  const userData = location.state?.userData;

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