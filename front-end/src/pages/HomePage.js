import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItems } from '../api';


const HomePage = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems().then((response) => setItems(response.data)).catch(console.error);
  }, []);

  return (
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
  );
};

export default HomePage;
