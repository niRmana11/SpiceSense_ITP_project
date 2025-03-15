import React, { useState, useEffect } from "react";

const CreditCardPage = () => {
    const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage
    const userId = user ? user._id : null;

    const [cards, setCards] = useState([]);
    const [formData, setFormData] = useState({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
    const [editingCardId, setEditingCardId] = useState(null);

    const API_BASE_URL = "http://localhost:5000/api/credit-cards";

    // Fetch user's credit cards
    useEffect(() => {
        if (!userId) return;

        fetch(`${API_BASE_URL}/${userId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => setCards(data))
            .catch(err => console.error("Error fetching credit cards:", err));
    }, [userId]);

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Add or update a credit card
    const handleSubmit = (e) => {
        e.preventDefault();
        const method = editingCardId ? "PUT" : "POST";
        const url = editingCardId ? `${API_BASE_URL}/${editingCardId}` : API_BASE_URL;

        fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, ...formData }),
        })
            .then(res => res.json())
            .then(() => {
                setFormData({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
                setEditingCardId(null);
                return fetch(`${API_BASE_URL}/${userId}`).then(res => res.json());
            })
            .then(data => setCards(data))
            .catch(err => console.error("Error saving credit card:", err));
    };

    // Edit credit card
    const handleEdit = (card) => {
        setFormData({ cardNumber: card.cardNumber, cardHolder: card.cardHolder, expiryDate: card.expiryDate, cvv: card.cvv });
        setEditingCardId(card._id);
    };

    // Delete credit card
    const handleDelete = (cardId) => {
        fetch(`${API_BASE_URL}/${cardId}`, { method: "DELETE" })
            .then(() => fetch(`${API_BASE_URL}/${userId}`).then(res => res.json()))
            .then(data => setCards(data))
            .catch(err => console.error("Error deleting credit card:", err));
    };

    return (
        <div>
            <h2>My Saved Credit Cards</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>Card Number</th>
                        <th>Card Holder</th>
                        <th>Expiry Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {cards.map(card => (
                        <tr key={card._id}>
                            <td>**** **** **** {card.cardNumber.slice(-4)}</td>
                            <td>{card.cardHolder}</td>
                            <td>{card.expiryDate}</td>
                            <td>
                                <button onClick={() => handleEdit(card)}>Edit</button>
                                <button onClick={() => handleDelete(card._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3>{editingCardId ? "Edit Credit Card" : "Add New Credit Card"}</h3>
            <form onSubmit={handleSubmit}>
                <input type="text" name="cardNumber" placeholder="Card Number" value={formData.cardNumber} onChange={handleChange} required />
                <input type="text" name="cardHolder" placeholder="Card Holder Name" value={formData.cardHolder} onChange={handleChange} required />
                <input type="text" name="expiryDate" placeholder="Expiry Date (MM/YY)" value={formData.expiryDate} onChange={handleChange} required />
                <input type="text" name="cvv" placeholder="CVV" value={formData.cvv} onChange={handleChange} required />
                <button type="submit">{editingCardId ? "Update Card" : "Add Card"}</button>
            </form>
        </div>
    );
};

export default CreditCardPage;
