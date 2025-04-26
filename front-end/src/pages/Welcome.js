import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/spicesense.css'; // Import the CSS

const Welcome = () => {
  return (
    <div className="spicesense-page">
      {/* Header */}
      <header className="spicesense-header">
        <div className="spicesense-logo">
          <span>SpiceSense</span>
        </div>
      </header>

      {/* Slideshow */}
      <div className="spicesense-slideshow">
        <div className="spicesense-slide">
          <img
            src="https://png.pngtree.com/background/20230611/original/pngtree-several-bowls-of-fresh-spiced-herbs-and-spices-picture-image_3143893.jpg"
            alt="Spices 1"
          />
        </div>
        <div className="spicesense-slide">
          <img
            src="https://mahathalaspices.com/wp-content/uploads/2024/01/IMG_0456-1024x683.jpg"
            alt="Spices 2"
          />
        </div>
        <div className="spicesense-slide">
          <img
            src="..\assets\spisesenselogo.png"
            alt="Spices 3"
          />
        </div>
      </div>

      {/* Welcome Content */}
      <div className="spicesense-container">
        <h1 className="spicesense-title">Welcome to SpiceSense</h1>
        <div className="spicesense-links">
          <Link to="/register" className="spicesense-btn primary">Register</Link>
          <Link to="/login" className="spicesense-btn secondary">Login</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="spicesense-footer">
        <p>© {new Date().getFullYear()} SpiceSense. All rights reserved.</p>
        <div className="spicesense-footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;