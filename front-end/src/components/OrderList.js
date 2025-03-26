// OrdersList.js
import { useEffect, useState } from "react";
import axios from "axios";

function OrdersList({ userId }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState({});
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [newCard, setNewCard] = useState({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
  const [cardErrors, setCardErrors] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/orders/${userId}`);
        setOrders(response.data);
        setFilteredOrders(response.data);
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

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = orders.filter(order => {
      // Check order ID
      if (order._id.toLowerCase().includes(term)) return true;
      // Check status
      if (order.status.toLowerCase().includes(term)) return true;
      // Check item names
      return order.items.some(item => 
        items[item.itemId]?.toLowerCase().includes(term)
      );
    });
    setFilteredOrders(filtered);
  };

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
    setSelectedCard(null);
    setNewCard({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
    setCardErrors({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
  };

  // Validate credit card
  const validateCardForm = () => {
    let isValid = true;
    const newErrors = {
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: ""
    };

    if (selectedCard) {
      setCardErrors(newErrors);
      return true;
    }

    const cleanNumber = newCard.cardNumber.replace(/\s/g, '');
    if (!cleanNumber) {
      newErrors.cardNumber = "Card number is required";
      isValid = false;
    } else if (!/^\d+$/.test(cleanNumber)) {
      newErrors.cardNumber = "Card number must contain only digits";
      isValid = false;
    } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      newErrors.cardNumber = "Card number must be between 13 and 19 digits";
      isValid = false;
    }

    if (!newCard.cardHolder.trim()) {
      newErrors.cardHolder = "Card holder name is required";
      isValid = false;
    }

    if (!newCard.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
      isValid = false;
    } else if (!/^\d{2}\/\d{2}$/.test(newCard.expiryDate)) {
      newErrors.expiryDate = "Use MM/YY format";
      isValid = false;
    }

    if (!newCard.cvv) {
      newErrors.cvv = "CVV is required";
      isValid = false;
    } else if (!/^\d{3,4}$/.test(newCard.cvv)) {
      newErrors.cvv = "CVV must be 3 or 4 digits";
      isValid = false;
    }

    setCardErrors(newErrors);
    return isValid;
  };

  // Handle new card input
  const handleNewCardChange = (e) => {
    const { name, value } = e.target;
    setNewCard({ ...newCard, [name]: value });
    
    if (cardErrors[name]) {
      setCardErrors({
        ...cardErrors,
        [name]: ""
      });
    }
  };

  // Handle selection of a saved card
  const handleCardSelection = (card) => {
    setSelectedCard(card);
    setCardErrors({
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: ""
    });
  };

  // Handle payment
  const handlePayment = async () => {
    if (!selectedCard && !validateCardForm()) {
      return;
    }

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
  
      setOrders(
        orders.map((order) =>
          order._id === currentOrder._id ? { ...order, status: "paid" } : order
        )
      );
      setFilteredOrders(
        filteredOrders.map((order) =>
          order._id === currentOrder._id ? { ...order, status: "paid" } : order
        )
      );
      setShowPaymentModal(false);
      setSelectedCard(null);
      setNewCard({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
  
      alert("Payment Successful");
  
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
      }
    } catch (error) {
      console.error("Payment error:", error.response ? error.response.data : error.message);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div>
      <h2>My Orders</h2>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by Order ID, Status, or Item Name..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            ...inputStyle,
            width: "300px",
            marginBottom: "10px"
          }}
        />
      </div>

      {filteredOrders.length > 0 ? (
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
            {filteredOrders.map((order) => (
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
        <p>No orders found{searchTerm ? " matching your search" : ""}.</p>
      )}

      {showPaymentModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3>Pay for Order #{currentOrder._id}</h3>
            <p>Total: ${currentOrder.total.toFixed(2)}</p>

            <h4>Select a Saved Card</h4>
            {cards.length > 0 ? (
              <div style={{ marginBottom: "20px" }}>
                {cards.map((card) => (
                  <div key={card._id} style={{ margin: "8px 0" }}>
                    <input
                      type="radio"
                      id={`card-${card._id}`}
                      name="card"
                      value={card._id}
                      checked={selectedCard && selectedCard._id === card._id}
                      onChange={() => handleCardSelection(card)}
                    />
                    <label htmlFor={`card-${card._id}`} style={{ marginLeft: "8px" }}>
                      **** **** **** {card.cardNumber.slice(-4)} ({card.cardHolder})
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p>No saved cards found.</p>
            )}

            <h4>Or Enter New Card</h4>
            <div style={formGroupStyle}>
              <label htmlFor="cardNumber">Card Number</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                placeholder="Card Number"
                value={newCard.cardNumber}
                onChange={handleNewCardChange}
                style={cardErrors.cardNumber ? errorInputStyle : inputStyle}
              />
              {cardErrors.cardNumber && (
                <div style={errorMessageStyle}>{cardErrors.cardNumber}</div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="cardHolder">Cardholder Name</label>
              <input
                type="text"
                id="cardHolder"
                name="cardHolder"
                placeholder="Card Holder Name"
                value={newCard.cardHolder}
                onChange={handleNewCardChange}
                style={cardErrors.cardHolder ? errorInputStyle : inputStyle}
              />
              {cardErrors.cardHolder && (
                <div style={errorMessageStyle}>{cardErrors.cardHolder}</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={newCard.expiryDate}
                  onChange={handleNewCardChange}
                  style={cardErrors.expiryDate ? errorInputStyle : inputStyle}
                />
                {cardErrors.expiryDate && (
                  <div style={errorMessageStyle}>{cardErrors.expiryDate}</div>
                )}
              </div>

              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  placeholder="CVV"
                  value={newCard.cvv}
                  onChange={handleNewCardChange}
                  style={cardErrors.cvv ? errorInputStyle : inputStyle}
                />
                {cardErrors.cvv && (
                  <div style={errorMessageStyle}>{cardErrors.cvv}</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button 
                onClick={handlePayment} 
                style={buttonStyle}
              >
                Pay Now
              </button>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                style={cancelButtonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
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
  zIndex: 1000
};

const modalContentStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "5px",
  width: "400px",
  maxHeight: "80vh",
  overflowY: "auto"
};

const formGroupStyle = {
  marginBottom: "15px"
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginTop: "5px"
};

const errorInputStyle = {
  display: "block",
  width: "100%",
  padding: "8px",
  border: "1px solid #e74c3c",
  borderRadius: "4px",
  marginTop: "5px"
};

const errorMessageStyle = {
  color: "#e74c3c",
  fontSize: "12px",
  marginTop: "5px"
};

const buttonStyle = {
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  padding: "10px 15px",
  borderRadius: "4px",
  cursor: "pointer"
};

const cancelButtonStyle = {
  backgroundColor: "#95a5a6",
  color: "white",
  border: "none",
  padding: "10px 15px",
  borderRadius: "4px",
  cursor: "pointer"
};

export default OrdersList;