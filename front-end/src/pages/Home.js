import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchItems } from '../api';

const Home = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if userData was passed via state from Dashboard
        const passedUserData = location.state?.userData;
        if (passedUserData) {
          setUserData(passedUserData);
          return;
        }

        // Otherwise, fetch it
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

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const [items, setItems] = useState([]);
    
  
    useEffect(() => {
      fetchItems().then((response) => setItems(response.data)).catch(console.error);
    }, []);


  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      {/* Navigation Bar */}
      <nav className="bg-amber-600 p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">SpiceSense</h1>
        {userData ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/user-profile", { state: { userData } })}
              className="hover:underline"
            >
              {userData.name}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </nav>

      {/* Main Content */}
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