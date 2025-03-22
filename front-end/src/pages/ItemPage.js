import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchItemDetails } from '../api';



const ItemPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItemDetails(id).then((response) => setItem(response.data)).catch(console.error);
  }, [id]);

  if (!item) return <p>Loading...</p>;

  return (
    <div>
      <h2>{item.name}</h2>
      <p>Category: {item.category}</p>
      <p>Price: ${item.price}</p>
      <p>Stock: {item.stock}</p>
      <button onClick={() => navigate(`/order/${item._id}`)}>Order Item</button>
    </div>
  );
};

export default ItemPage;
