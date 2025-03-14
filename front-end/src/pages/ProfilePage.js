import { useEffect, useState } from "react";
import axios from "axios";

function ProfilePage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders", error);
      }
    };

    fetchOrders();
  }, []);

  const handlePayment = async (orderId) => {
    try {
      await axios.post(`http://localhost:5000/api/payments`, { orderId });
      alert("Payment Successful");
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  return (
    <div>
      <h2>My Orders</h2>
      <ul>
        {orders.map((order) => (
          <li key={order._id}>
            {order.item} - ${order.amount}
            {order.status === "Pending" && (
              <button onClick={() => handlePayment(order._id)}>Pay Now</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProfilePage;
