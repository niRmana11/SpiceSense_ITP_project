// pages/AboutUs.js
import React from "react";
import NavigationBar from "../components/NavigationBar";
import { useLocation } from "react-router-dom";

const AboutUs = () => {
  const location = useLocation();
  const userData = location.state?.userData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <NavigationBar userData={userData} />
      <div className="p-8 text-center">
        <h2 className="text-3xl font-bold text-amber-700 mb-4">About Us</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Welcome to SpiceSense! We are passionate about bringing the finest spices from around the world to your kitchen. 
          Our mission is to provide high-quality, authentic spices that enhance your culinary experience. 
          Founded by a team of spice enthusiasts, we work directly with suppliers to ensure freshness and sustainability.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;