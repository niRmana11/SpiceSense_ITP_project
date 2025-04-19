// pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchItems } from '../api';
import NavigationBar from "../components/NavigationBar";
import "../Styles/Home.css"; // Import CSS from Styles folder

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

  return (
    <div className="home-container">
      <NavigationBar userData={userData} />

      <div className="home-header">
        <h2 className="home-title">
          Welcome to SpiceSense, {userData?.name || "Customer"}!
        </h2>
        <p className="home-subtitle">Explore our range of spices and more.</p>
        {error && <p className="home-error">{error}</p>}
      </div>

      <div className="home-items-section">
        <h1 className="home-items-title">Spice Items</h1>
        <div className="home-items-grid">
          {items.map((item) => (
            <div key={item._id} className="home-item-card">
              <h3 className="home-item-name">{item.name}</h3>
              <p className="home-item-price">Price: ${item.price}</p>
              <button 
                onClick={() => navigate(`/item/${item._id}`)}
                className="home-item-button"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;