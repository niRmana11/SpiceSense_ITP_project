// pages/ItemPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchItemDetails } from '../api';
import "../Styles/ItemPage.css"; // Import CSS from Styles folder
import NavigationBar from "../components/NavigationBar";

const ItemPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItemDetails(id).then((response) => setItem(response.data)).catch(console.error);
  }, [id]);

  if (!item) return <p className="item-page-loading">Loading...</p>;

  return (
    <div>
            <NavigationBar />
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