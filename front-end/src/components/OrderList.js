// OrdersList.js
import { useEffect, useState } from "react";
import axios from "axios";

function OrdersList({ userId }) {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState({});
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [newCard, setNewCard] = useState({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Fetch orders
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

  // Fetch items
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

  // Fetch user's credit cards when opening payment modal
  const fetchCreditCards = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/credit-cards/${userId}`);
      setCards(response.data);
    } catch (error) {
      console.error("Error fetching credit cards", error);
    }
  };

  // Open payment modal
  const openPaymentModal = (order) => {
    setCurrentOrder(order);
    setShowPaymentModal(true);
    fetchCreditCards();
  };

  // Handle new card input
  const handleNewCardChange = (e) => {
    setNewCard({ ...newCard, [e.target.name]: e.target.value });
  };

  // Handle payment

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("token");
      let paymentData = {
        userId,
        orderId: currentOrder._id,
        amount: currentOrder.total,
      };
  
      if (selectedCard) {
        paymentData.cardId = selectedCard._id;
      } else if (newCard.cardNumber) {
        const cardResponse = await axios.post(
          "http://localhost:5000/api/credit-cards",
          { userId, ...newCard },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        paymentData.cardId = cardResponse.data._id;
      } else {
        alert("Please select a card or enter new card details.");
        return;
      }
  
      console.log("Sending payment data:", paymentData);
      const paymentResponse = await axios.post(
        "http://localhost:5000/api/payments",
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Payment response:", paymentResponse.data);
  
      // Update UI immediately after payment success
      setOrders(
        orders.map((order) =>
          order._id === currentOrder._id ? { ...order, status: "paid" } : order
        )
      );
      setShowPaymentModal(false);
      setSelectedCard(null);
      setNewCard({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
  
      // Show success alert immediately
      alert("Payment Successful");
  
      // Attempt invoice download separately
      console.log("Fetching invoice for paymentId:", paymentResponse.data.paymentId);
      try {
        const invoiceResponse = await axios.get(
          `http://localhost:5000/api/payments/invoice/${paymentResponse.data.paymentId}`,
          { responseType: "blob" }
        );
        console.log("Invoice response received:", invoiceResponse.status);
        const url = window.URL.createObjectURL(new Blob([invoiceResponse.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${paymentResponse.data.paymentId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (invoiceError) {
        console.error("Invoice download error (non-critical):", invoiceError.message);
        // Optionally notify user without overriding payment success
        // alert("Invoice download failed, but payment was successful. Check your downloads.");
      }
    } catch (error) {
      console.error("Payment error:", error.response ? error.response.data : error.message);
      alert("Payment failed. Please try again.");
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
                      {items[item.itemId] || "Loading..."} - {item.quantity} pcs @ $
                      {item.price.toFixed(2)}
                    </div>
                  ))}
                </td>
                <td>${order.total.toFixed(2)}</td>
                <td>{order.status}</td>
                <td>
                  {order.status === "pending" ? (
                    <button onClick={() => openPaymentModal(order)}>Pay Now</button>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3>Pay for Order #{currentOrder._id}</h3>
            <p>Total: ${currentOrder.total.toFixed(2)}</p>

            <h4>Select a Saved Card</h4>
            {cards.length > 0 ? (
              cards.map((card) => (
                <div key={card._id}>
                  <input
                    type="radio"
                    name="card"
                    value={card._id}
                    onChange={() => setSelectedCard(card)}
                  />
                  **** **** **** {card.cardNumber.slice(-4)} ({card.cardHolder})
                </div>
              ))
            ) : (
              <p>No saved cards found.</p>
            )}

            <h4>Or Enter New Card</h4>
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={newCard.cardNumber}
              onChange={handleNewCardChange}
            />
            <input
              type="text"
              name="cardHolder"
              placeholder="Card Holder Name"
              value={newCard.cardHolder}
              onChange={handleNewCardChange}
            />
            <input
              type="text"
              name="expiryDate"
              placeholder="Expiry Date (MM/YY)"
              value={newCard.expiryDate}
              onChange={handleNewCardChange}
            />
            <input
              type="text"
              name="cvv"
              placeholder="CVV"
              value={newCard.cvv}
              onChange={handleNewCardChange}
            />

            <button onClick={handlePayment}>Pay</button>
            <button onClick={() => setShowPaymentModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Basic inline styles for the modal
const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalContentStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "5px",
  width: "400px",
};

export default OrdersList;