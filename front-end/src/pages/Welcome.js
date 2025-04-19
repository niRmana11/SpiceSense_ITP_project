import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/welcome.css'; // Import the CSS

const Welcome = () => {
  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome to SpiceSense</h1>
        <div className="welcome-links">
          <Link to="/register" className="welcome-btn">Register</Link>
          <Link to="/login" className="welcome-btn secondary">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;