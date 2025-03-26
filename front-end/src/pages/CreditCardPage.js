import React, { useState, useEffect } from "react";

const CreditCardPage = () => {
    const userId = sessionStorage.getItem("userId");

    const [cards, setCards] = useState([]);
    const [formData, setFormData] = useState({ 
        cardNumber: "", 
        cardHolder: "", 
        expiryDate: "", 
        cvv: "" 
    });
    const [errors, setErrors] = useState({
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: ""
    });
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

    // Basic validation function
    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            cardNumber: "",
            cardHolder: "",
            expiryDate: "",
            cvv: ""
        };

        // Card number validation - just check if it has 16 digits
        const cleanNumber = formData.cardNumber.replace(/\s/g, '');
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

        // Card holder validation - just check if it's not empty
        if (!formData.cardHolder.trim()) {
            newErrors.cardHolder = "Card holder name is required";
            isValid = false;
        }

        // Expiry date validation - check format MM/YY
        if (!formData.expiryDate) {
            newErrors.expiryDate = "Expiry date is required";
            isValid = false;
        } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
            newErrors.expiryDate = "Use MM/YY format";
            isValid = false;
        }

        // CVV validation - check if it's 3 or 4 digits
        if (!formData.cvv) {
            newErrors.cvv = "CVV is required";
            isValid = false;
        } else if (!/^\d{3,4}$/.test(formData.cvv)) {
            newErrors.cvv = "CVV must be 3 or 4 digits";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Add or update a credit card
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate form before submitting
        if (!validateForm()) {
            return;
        }
        
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
        setFormData({ 
            cardNumber: card.cardNumber, 
            cardHolder: card.cardHolder, 
            expiryDate: card.expiryDate, 
            cvv: card.cvv 
        });
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
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">My Saved Credit Cards</h2>
            
            <table className="w-full border-collapse mb-6">
                <thead>
                    <tr>
                        <th className="border p-2 text-left">Card Number</th>
                        <th className="border p-2 text-left">Card Holder</th>
                        <th className="border p-2 text-left">Expiry Date</th>
                        <th className="border p-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {cards.map(card => (
                        <tr key={card._id}>
                            <td className="border p-2">**** **** **** {card.cardNumber.slice(-4)}</td>
                            <td className="border p-2">{card.cardHolder}</td>
                            <td className="border p-2">{card.expiryDate}</td>
                            <td className="border p-2">
                                <button 
                                    onClick={() => handleEdit(card)}
                                    className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(card._id)}
                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="bg-gray-100 p-4 rounded">
                <h3 className="text-xl font-semibold mb-4">
                    {editingCardId ? "Edit Credit Card" : "Add New Credit Card"}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1">Card Number</label>
                        <input 
                            type="text" 
                            name="cardNumber" 
                            placeholder="Card Number" 
                            value={formData.cardNumber} 
                            onChange={handleChange} 
                            className="w-full p-2 border rounded"
                        />
                        {errors.cardNumber && (
                            <p className="text-red-500 text-sm">{errors.cardNumber}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block mb-1">Card Holder Name</label>
                        <input 
                            type="text" 
                            name="cardHolder" 
                            placeholder="Card Holder Name" 
                            value={formData.cardHolder} 
                            onChange={handleChange} 
                            className="w-full p-2 border rounded"
                        />
                        {errors.cardHolder && (
                            <p className="text-red-500 text-sm">{errors.cardHolder}</p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1">Expiry Date</label>
                            <input 
                                type="text" 
                                name="expiryDate" 
                                placeholder="MM/YY" 
                                value={formData.expiryDate} 
                                onChange={handleChange} 
                                className="w-full p-2 border rounded"
                            />
                            {errors.expiryDate && (
                                <p className="text-red-500 text-sm">{errors.expiryDate}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block mb-1">CVV</label>
                            <input 
                                type="text" 
                                name="cvv" 
                                placeholder="CVV" 
                                value={formData.cvv} 
                                onChange={handleChange} 
                                className="w-full p-2 border rounded"
                            />
                            {errors.cvv && (
                                <p className="text-red-500 text-sm">{errors.cvv}</p>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    >
                        {editingCardId ? "Update Card" : "Add Card"}
                    </button>
                    
                    {editingCardId && (
                        <button 
                            type="button"
                            onClick={() => {
                                setFormData({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
                                setEditingCardId(null);
                            }}
                            className="bg-gray-300 text-gray-800 py-2 px-4 rounded ml-2"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CreditCardPage;