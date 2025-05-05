// pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchItems } from '../api';
import NavigationBar from "../components/NavigationBar";
import "../Styles/Home.css"; // Updated to Home.css
import homebanner from "../images/homebanner.jpg";

const Home = () => {
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

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems().then((response) => setItems(response.data)).catch(console.error);
  }, []);

  // Select first 3 items as featured (or adjust based on your preference)
  const featuredItems = items.slice(0, 3);

  return (
    <div className="home-spiced-container">
      <NavigationBar userData={userData} />

      <section className="home-spiced-hero">
        <h1 className="home-spiced-hero-title">
          Welcome to SpiceSense, {userData?.name || "Customer"}!
        </h1>
        <p className="home-spiced-hero-text">
          Discover the world’s finest spices to elevate your culinary creations.
        </p>
        <img
          src={homebanner}
          alt="Vibrant assortment of spices"
          className="home-spiced-hero-image"
        />
        {error && <p className="home-spiced-error">{error}</p>}
      </section>

      <section className="home-spiced-featured">
        <h2 className="home-spiced-section-title">Featured Spices</h2>
        <div className="home-spiced-featured-grid">
          {featuredItems.length > 0 ? (
            featuredItems.map((item) => (
              <div key={item._id} className="home-spiced-featured-card">
                {/* <img
                  src={item.image || "https://via.placeholder.com/200?text=Spice+Image"}
                  alt={item.name}
                  className="home-spiced-featured-image"
                /> */}
                <h3 className="home-spiced-featured-name">{item.name}</h3>
                <p className="home-spiced-featured-price">Price: ${item.price}</p>
                <p className="home-spiced-featured-description">
                  {item.description || "A premium spice to enhance your dishes."}
                </p>
                <button
                  onClick={() => navigate(`/item/${item._id}`)}
                  className="home-spiced-featured-button"
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <p className="home-spiced-no-items">No featured spices available.</p>
          )}
        </div>
      </section>

      <section className="home-spiced-items">
        <h2 className="home-spiced-section-title">All Spices</h2>
        <div className="home-spiced-items-grid">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item._id} className="home-spiced-item-card">
                {/* <img
                  src={item.image || "https://via.placeholder.com/150?text=Spice+Image"}
                  alt={item.name}
                  className="home-spiced-item-image"
                /> */}
                <h3 className="home-spiced-item-name">{item.name}</h3>
                <p className="home-spiced-item-price">Price: ${item.price}</p>
                <p className="home-spiced-item-description">
                  {item.description || "Perfect for adding flavor to any recipe."}
                </p>
                <button
                  onClick={() => navigate(`/item/${item._id}`)}
                  className="home-spiced-item-button"
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <p className="home-spiced-no-items">No spices available at the moment.</p>
          )}
        </div>
      </section>

      <section className="home-spiced-testimonials">
        <h2 className="home-spiced-section-title">What Our Customers Say</h2>
        <div className="home-spiced-testimonials-grid">
          <div className="home-spiced-testimonial-card">
            <p className="home-spiced-testimonial-text">
              "SpiceSense transformed my cooking! The quality of their spices is unmatched."
            </p>
            <p className="home-spiced-testimonial-author">— Sarah K., Home Chef</p>
          </div>
          <div className="home-spiced-testimonial-card">
            <p className="home-spiced-testimonial-text">
              "Fast shipping and authentic flavors. I’m a loyal customer for life!"
            </p>
            <p className="home-spiced-testimonial-author">— Miguel R., Food Blogger</p>
          </div>
          <div className="home-spiced-testimonial-card">
            <p className="home-spiced-testimonial-text">
              "The variety is incredible. Every spice tells a story!"
            </p>
            <p className="home-spiced-testimonial-author">— Priya S., Culinary Enthusiast</p>
          </div>
        </div>
      </section>

      <section className="home-spiced-cta">
        <h2 className="home-spiced-cta-title">Ready to Spice Up Your Kitchen?</h2>
        <button
          onClick={() => navigate("/home", { state: { userData } })}
          className="home-spiced-cta-button"
        >
          Shop Now
        </button>
      </section>
    </div>
  );
};

export default Home;