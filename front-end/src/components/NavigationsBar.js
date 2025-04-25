import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/NavigationBar.css';

const NavigationBar = () => {
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem("userId") !== null;
  
  // This is a simplified version - you would need to adjust 
  // based on your actual authentication implementation
  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    navigate('/login');
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-logo">
        <Link to="/home">SpiceRack</Link>
      </div>
      
      <div className="nav-links">
        <Link to="/home" className="nav-link">Home</Link>
        <Link to="/about-us" className="nav-link">About</Link>
        <Link to="/contact-us" className="nav-link">Contact</Link>
        
        {isLoggedIn ? (
          <>
            {/* Add Deliveries link for logged-in users */}
            <Link to="/deliveries" className="nav-link">My Deliveries</Link>
            <div className="dropdown">
              <button className="dropbtn">Account</button>
              <div className="dropdown-content">
                <Link to="/profile">Profile</Link>
                <Link to="/credit-cards">Payment Methods</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
