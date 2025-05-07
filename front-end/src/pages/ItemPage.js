// pages/ItemPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchItemDetails } from '../api';
import "../Styles/ItemPage.css"; // Import CSS from Styles folder
import NavigationBar from "../components/NavigationBar";
import axios from "axios";

const ItemPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
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


  useEffect(() => {
    fetchItemDetails(id).then((response) => setItem(response.data)).catch(console.error);
  }, [id]);

  if (!item) return <p className="item-page-loading">Loading...</p>;

  return (
    <div>
            <NavigationBar userData={userData} />
    <div className="item-page-container">
      <h2 className="item-page-title">{item.name}</h2>
      <div className="item-page-details">
        <p className="item-page-detail"><strong>Category:</strong> {item.category}</p>
        <p className="item-page-detail"><strong>Price:</strong> ${item.price}</p>
        <p className="item-page-detail"><strong>Stock:</strong> {item.stock}</p>
      </div>
      <button 
        onClick={() => navigate(`/order/${item._id}`)}
        className="item-page-order-btn"
      >
        Order Item
      </button>
    </div>
    </div>
  );
};

export default ItemPage;