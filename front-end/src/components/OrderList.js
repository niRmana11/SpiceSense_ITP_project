// OrdersList.js
import { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/OrdersList.css";

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
      if (order._id.toLowerCase().includes(term)) return true;
      if (order.status.toLowerCase().includes(term)) return true;
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

  // Open payment modal with confirmation
  const openPaymentModal = (order) => {
    const confirmPayment = window.confirm(
      `Are you sure you want to proceed with payment for Order #${order._id} amounting to $${order.total.toFixed(2)}?`
    );
    
    if (confirmPayment) {
      setCurrentOrder(order);
      setShowPaymentModal(true);
      fetchCreditCards();
      setSelectedCard(null);
      setNewCard({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
      setCardErrors({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
    }
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
  
      const paymentResponse = await axios.post(
        "http://localhost:5000/api/payments",
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
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
  
      try {
        const invoiceResponse = await axios.get(
          `http://localhost:5000/api/payments/invoice/${paymentResponse.data.paymentId}`,
          { responseType: "blob" }
        );
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
    <div className="orders-container">
      <h2>My Orders</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Order ID, Status, or Item Name..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {filteredOrders.length > 0 ? (
        <table className="orders-table">
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
                    <button 
                      onClick={() => openPaymentModal(order)}
                      className="pay-button"
                    >
                      Pay Now
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
        <p className="no-orders">No orders found{searchTerm ? " matching your search" : ""}.</p>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Pay for Order #{currentOrder._id}</h3>
            <p>Total: ${currentOrder.total.toFixed(2)}</p>

            <h4>Select a Saved Card</h4>
            {cards.length > 0 ? (
              <div className="cards-list">
                {cards.map((card) => (
                  <div key={card._id} className="card-option">
                    <input
                      type="radio"
                      id={`card-${card._id}`}
                      name="card"
                      value={card._id}
                      checked={selectedCard && selectedCard._id === card._id}
                      onChange={() => handleCardSelection(card)}
                    />
                    <label htmlFor={`card-${card._id}`}>
                      **** **** **** {card.cardNumber.slice(-4)} ({card.cardHolder})
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p>No saved cards found.</p>
            )}

            <h4>Or Enter New Card</h4>
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                placeholder="Card Number"
                value={newCard.cardNumber}
                onChange={handleNewCardChange}
                className={cardErrors.cardNumber ? "input-error" : ""}
              />
              {cardErrors.cardNumber && (
                <span className="error-message">{cardErrors.cardNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="cardHolder">Cardholder Name</label>
              <input
                type="text"
                id="cardHolder"
                name="cardHolder"
                placeholder="Card Holder Name"
                value={newCard.cardHolder}
                onChange={handleNewCardChange}
                className={cardErrors.cardHolder ? "input-error" : ""}
              />
              {cardErrors.cardHolder && (
                <span className="error-message">{cardErrors.cardHolder}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={newCard.expiryDate}
                  onChange={handleNewCardChange}
                  className={cardErrors.expiryDate ? "input-error" : ""}
                />
                {cardErrors.expiryDate && (
                  <span className="error-message">{cardErrors.expiryDate}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  placeholder="CVV"
                  value={newCard.cvv}
                  onChange={handleNewCardChange}
                  className={cardErrors.cvv ? "input-error" : ""}
                />
                {cardErrors.cvv && (
                  <span className="error-message">{cardErrors.cvv}</span>
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button 
                onClick={handlePayment}
                className="pay-button"
              >
                Pay Now
              </button>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="cancel-button"
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

export default OrdersList;