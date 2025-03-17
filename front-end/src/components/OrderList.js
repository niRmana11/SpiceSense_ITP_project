import { useEffect, useState } from "react";
import axios from "axios";

function OrdersList({ userId }) {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/orders/${userId}`);
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders", error);
      }
    };
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/items");
        const itemsMap = response.data.reduce((acc, item) => {
          acc[item._id] = item.name;
          return acc;
        }, {});
        setItems(itemsMap);
      } catch (error) {
        console.error("Error fetching items", error);
      }
    };
    fetchItems();
  }, []);

  const handlePayment = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/payments",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Payment Successful");

      // Update order status and store invoice ID
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: "paid", invoiceId: response.data.invoiceId } : order
      ));
    } catch (error) {
      console.error("Payment failed", error);
      alert("Payment failed. Try again.");
    } finally {
      setLoading(false);
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
              <th>Invoice</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>
                  {order.items.map((item, index) => (
                    <div key={index}>
                      {items[item.itemId] || "Loading..."} - {item.quantity} pcs @ ${item.price.toFixed(2)}
                    </div>
                  ))}
                </td>
                <td>${order.total.toFixed(2)}</td>
                <td>{order.status}</td>
                <td>
                  {order.invoiceId ? <a href={`/download-invoice/${order.invoiceId}`}>Download</a> : "-"}
                </td>
                <td>
                  {order.status === "pending" ? (
                    <button onClick={() => handlePayment(order._id)} disabled={loading}>
                      {loading ? "Processing..." : "Pay Now"}
                    </button>
                  ) : (
                    <span>✅ Paid</span>
                  )}
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

export default OrdersList;
