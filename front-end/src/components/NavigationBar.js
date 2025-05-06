// components/NavigationBar.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../Styles/NavigationBar.css";

const NavigationBar = ({ userData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Determine active link based on current path
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav-spiced-container">
      <h1 className="nav-spiced-title">SpiceSense</h1>
      <button className="nav-spiced-hamburger" onClick={toggleMenu}>
        <span className="nav-spiced-hamburger-line"></span>
        <span className="nav-spiced-hamburger-line"></span>
        <span className="nav-spiced-hamburger-line"></span>
      </button>
      <div className={`nav-spiced-links ${isMenuOpen ? "nav-spiced-links-open" : ""}`}>
        <button
          onClick={() => navigate("/home", { state: { userData } })}
          className={`nav-spiced-link ${isActive("/home") ? "nav-spiced-link-active" : ""}`}
        >
          Home
        </button>
        <button
          onClick={() => navigate("/about-us")}
          className={`nav-spiced-link ${isActive("/about-us") ? "nav-spiced-link-active" : ""}`}
        >
          About Us
        </button>
        <button
          onClick={() => navigate("/contact-us")}
          className={`nav-spiced-link ${isActive("/contact-us") ? "nav-spiced-link-active" : ""}`}
        >
          Contact Us
        </button>
        {userData ? (
          <div className="nav-spiced-user-section">
            <button
              onClick={() => navigate("/user-profile", { state: { userData } })}
              className={`nav-spiced-user-name ${isActive("/user-profile") ? "nav-spiced-link-active" : ""}`}
            >
              <span className="nav-spiced-user-icon">👤</span>
              {userData.name}
            </button>
            <button
              onClick={handleLogout}
              className="nav-spiced-logout-btn"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-spiced-loading">
            <span className="nav-spiced-spinner"></span>
            Loading...
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;