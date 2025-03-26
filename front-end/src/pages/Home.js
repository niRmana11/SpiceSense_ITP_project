// pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchItems } from '../api';
import NavigationBar from "../components/NavigationBar";

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <NavigationBar userData={userData} />

      <div className="p-8 text-center">
        <h2 className="text-3xl font-bold text-amber-700 mb-4">
          Welcome to SpiceSense, {userData?.name || "Customer"}!
        </h2>
        <p className="text-gray-600">Explore our range of spices and more.</p>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      <div>
        <h1>Spice Items</h1>
        <ul>
          {items.map((item) => (
            <li key={item._id}>
              <h3>{item.name}</h3>
              <p>Price: ${item.price}</p>
              <button onClick={() => navigate(`/item/${item._id}`)}>View Details</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;