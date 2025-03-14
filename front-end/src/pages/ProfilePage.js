import { useEffect, useState } from "react";
import axios from "axios";

function ProfilePage() {
  const [orders, setOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user._id) {
        console.error("User ID not found");
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/api/orders/${user._id}`);
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders", error);
      }
    };

    fetchOrders();
  }, [user]);

  const handlePayment = async (orderId) => {
    try {
      const token = localStorage.getItem("token"); // Get token for authentication
      await axios.post(
        "http://localhost:5000/api/payments",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Payment Successful");

      // Update order status in UI after payment
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: "paid" } : order
      ));
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  return (
    <div>
      <h2>My Orders</h2>
      {orders.length > 0 ? (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>
                  {order.items.map((item, index) => (
                    <div key={index}>
                      {item.itemId} - {item.quantity} pcs @ ${item.price.toFixed(2)}
                    </div>
                  ))}
                </td>
                <td>${order.total.toFixed(2)}</td>
                <td>{order.status}</td>
                <td>
                  {order.status === "pending" && (
                    <button onClick={() => handlePayment(order._id)}>Pay Now</button>
                  )}
                  {order.status === "paid" && <span>✅ Paid</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
}

export default ProfilePage;
