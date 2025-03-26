    // pages/ContactUs.js
import React from "react";
import NavigationBar from "../components/NavigationBar";
import { useLocation } from "react-router-dom";

const ContactUs = () => {
  const location = useLocation();
  const userData = location.state?.userData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <NavigationBar userData={userData} />
      <div className="p-8 text-center">
        <h2 className="text-3xl font-bold text-amber-700 mb-4">Contact Us</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-gray-600">
            Have questions or need assistance? Reach out to us!
          </p>
          <p><strong>Email:</strong> support@spicesense.com</p>
          <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          <p><strong>Address:</strong> 123 Spice Lane, Flavor Town, USA</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;