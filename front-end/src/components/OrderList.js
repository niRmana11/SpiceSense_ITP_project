
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
    cvv: "",
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

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

    const filtered = orders.filter((order) => {
      if (order._id.toLowerCase().includes(term)) return true;
      if (order.status.toLowerCase().includes(term)) return true;
      return order.items.some((item) =>
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
      cvv: "",
    };

    if (selectedCard) {
      setCardErrors(newErrors);
      return true;
    }

    const cleanNumber = newCard.cardNumber.replace(/\s/g, "");
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
      newErrors.cardHolder = "Cardholder name is required";
      isValid = false;
    }

    if (!newCard.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
      isValid = false;
    } else if (!/^\d{2}\/\d{2}$/.test(newCard.expiryDate)) {
      newErrors.expiryDate = "Use MM/YY format";
      isValid = false;
    } else {
      const [month, year] = newCard.expiryDate.split("/").map(Number);
      if (month < 1 || month > 12) {
        newErrors.expiryDate = "Month must be between 01 and 12";
        isValid = false;
      } else {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          newErrors.expiryDate = "Card has expired";
          isValid = false;
        }
      }
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
      setCardErrors({ ...cardErrors, [name]: "" });
    }
  };

  // Handle selection of a saved card
  const handleCardSelection = (card) => {
    setSelectedCard(card);
    setCardErrors({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
  };

  // Handle payment
  const handlePayment = async () => {
    if (!selectedCard && !validateCardForm()) {
      return;
    }

    setIsPaying(true);
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
        setIsPaying(false);
        return;
      }

      const paymentResponse = await axios.post(
        "http://localhost:5000/api/payments",
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update orders and maintain reversed order
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
      const errorMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).join(", ")
        : "Payment failed. Please try again.";
      alert(errorMessage);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="orders-spiced-container">
      <div className="orders-spiced-header">
        <input
          type="text"
          placeholder="Search by Order ID, Status, or Item Name..."
          value={searchTerm}
          onChange={handleSearch}
          className="orders-spiced-search-input"
          aria-label="Search orders"
        />
      </div>

      {filteredOrders.length > 0 ? (
        <div className="orders-spiced-table-wrapper">
          <table className="orders-spiced-table">
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
              {[...filteredOrders].reverse().map((order) => (
                <tr key={order._id} className="orders-spiced-row">
                  <td>{order._id}</td>
                  <td>
                    {order.items.map((item, index) => (
                      <div key={index} className="orders-spiced-item">
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
                        className="orders-spiced-pay-button"
                        aria-label={`Pay for order ${order._id}`}
                      >
                        Pay Now
                      </button>
                    ) : (
                      <span className="orders-spiced-paid" aria-label="Order paid">✅ Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="orders-spiced-no-orders">
          No orders found{searchTerm ? " matching your search" : ""}.
        </p>
      )}

      {showPaymentModal && (
        <div className="payment-spiced-overlay">
          <div className="payment-spiced-modal">
            <h3 className="payment-spiced-title">Pay for Order #{currentOrder._id}</h3>
            <p className="payment-spiced-total">Total: ${currentOrder.total.toFixed(2)}</p>

            <h4 className="payment-spiced-subtitle">Select a Saved Card</h4>
            {cards.length > 0 ? (
              <div className="payment-spiced-cards-list">
                {cards.map((card) => (
                  <div key={card._id} className="payment-spiced-card-option">
                    <input
                      type="radio"
                      id={`card-${card._id}`}
                      name="card"
                      value={card._id}
                      checked={selectedCard && selectedCard._id === card._id}
                      onChange={() => handleCardSelection(card)}
                      className="payment-spiced-radio"
                      aria-label={`Select card ending in ${card.cardNumber.slice(-4)}`}
                    />
                    <label htmlFor={`card-${card._id}`} className="payment-spiced-card-label">
                      <span className="payment-spiced-card-number">
                        **** **** **** {card.cardNumber.slice(-4)}
                      </span>
                      <span className="payment-spiced-card-holder">({card.cardHolder})</span>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="payment-spiced-no-cards">No saved cards found.</p>
            )}

            <h4 className="payment-spiced-subtitle">Or Enter New Card</h4>
            <div className="payment-spiced-form-group">
              <label htmlFor="cardNumber" className="payment-spiced-label">Card Number</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={newCard.cardNumber}
                onChange={handleNewCardChange}
                className={`payment-spiced-input ${cardErrors.cardNumber ? "payment-spiced-input-error" : ""}`}
                disabled={selectedCard}
                aria-invalid={cardErrors.cardNumber ? "true" : "false"}
              />
              {cardErrors.cardNumber && (
                <span className="payment-spiced-error-message">{cardErrors.cardNumber}</span>
              )}
            </div>

            <div className="payment-spiced-form-group">
              <label htmlFor="cardHolder" className="payment-spiced-label">Cardholder Name</label>
              <input
                type="text"
                id="cardHolder"
                name="cardHolder"
                placeholder="John Doe"
                value={newCard.cardHolder}
                onChange={handleNewCardChange}
                className={`payment-spiced-input ${cardErrors.cardHolder ? "payment-spiced-input-error" : ""}`}
                disabled={selectedCard}
                aria-invalid={cardErrors.cardHolder ? "true" : "false"}
              />
              {cardErrors.cardHolder && (
                <span className="payment-spiced-error-message">{cardErrors.cardHolder}</span>
              )}
            </div>

            <div className="payment-spiced-form-row">
              <div className="payment-spiced-form-group">
                <label htmlFor="expiryDate" className="payment-spiced-label">Expiry Date</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={newCard.expiryDate}
                  onChange={handleNewCardChange}
                  className={`payment-spiced-input ${cardErrors.expiryDate ? "payment-spiced-input-error" : ""}`}
                  disabled={selectedCard}
                  aria-invalid={cardErrors.expiryDate ? "true" : "false"}
                />
                {cardErrors.expiryDate && (
                  <span className="payment-spiced-error-message">{cardErrors.expiryDate}</span>
                )}
              </div>

              <div className="payment-spiced-form-group">
                <label htmlFor="cvv" className="payment-spiced-label">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  placeholder="123"
                  value={newCard.cvv}
                  onChange={handleNewCardChange}
                  className={`payment-spiced-input ${cardErrors.cvv ? "payment-spiced-input-error" : ""}`}
                  disabled={selectedCard}
                  aria-invalid={cardErrors.cvv ? "true" : "false"}
                />
                {cardErrors.cvv && (
                  <span className="payment-spiced-error-message">{cardErrors.cvv}</span>
                )}
              </div>
            </div>

            <div className="payment-spiced-buttons">
              <button
                onClick={handlePayment}
                className="payment-spiced-pay-button"
                disabled={isPaying}
                aria-label="Confirm payment"
              >
                {isPaying ? (
                  <span className="payment-spiced-spinner"></span>
                ) : (
                  "Pay Now"
                )}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="payment-spiced-cancel-button"
                disabled={isPaying}
                aria-label="Cancel payment"
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