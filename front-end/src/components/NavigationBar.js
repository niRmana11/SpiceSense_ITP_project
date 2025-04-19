// components/NavigationBar.js
import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/NavigationBar.css"; // Updated import path to Styles folder

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
    <nav className="nav-bar-container">
      <h1 className="nav-bar-title">SpiceSense</h1>
      <div className="nav-bar-links">
        <button
          onClick={() => navigate("/home", { state: { userData } })}
          className="nav-bar-link"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/about-us")}
          className="nav-bar-link"
        >
          About Us
        </button>
        <button
          onClick={() => navigate("/contact-us")}
          className="nav-bar-link"
        >
          Contact Us
        </button>
        {userData ? (
          <div className="nav-bar-user-section">
            <button
              onClick={() => navigate("/user-profile", { state: { userData } })}
              className="nav-bar-user-name"
            >
              {userData.name}
            </button>
            <button
              onClick={handleLogout}
              className="nav-bar-logout-btn"
            >
              Logout
            </button>
          </div>
        ) : (
          <p className="nav-bar-loading">Loading...</p>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;