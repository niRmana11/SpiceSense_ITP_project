// components/NavigationBar.js
import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NavigationBar = ({ userData }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-amber-600 p-4 text-white flex justify-between items-center">
      <h1 className="text-xl font-bold">SpiceSense</h1>
      <div className="flex items-center space-x-6">
        <button
          onClick={() => navigate("/home", { state: { userData } })}
          className="hover:underline"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/about-us")}
          className="hover:underline"
        >
          About Us
        </button>
        <button
          onClick={() => navigate("/contact-us")}
          className="hover:underline"
        >
          Contact Us
        </button>
        {userData ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/user-profile", { state: { userData } })}
              className="hover:underline"
            >
              {userData.name}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;