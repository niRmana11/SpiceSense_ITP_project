import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/inventoryTransaction.css";
import NavBar from "../components/navBar";
import backgroundImage from "../assets/background.png";

const API_URL = "http://localhost:5000/api";

const InventoryTransactions = () => {
    const [transactions, setTransactions] = useState([]);


    useEffect(() => {
        document.body.style.backgroundImage = `url(${backgroundImage})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundRepeat = "no-repeat";

        return () => {
            document.body.style.backgroundImage = "";
        };
    }, []);

    useEffect(() => {
        axios.get(`${API_URL}/stocks/transactions`)
            .then(response => setTransactions(response.data))
            .catch(error => console.error("Error fetching transactions:", error));
    }, []);



    return (
        <div>
            <NavBar />
            <div className="transactions-container">
                <h2>Stock Transactions</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Batch Number</th>
                            <th>Quantity</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.filter(stock => stock.product?.productName).map((txn) => (
                            <tr key={txn._id}>
                                <td>{txn.product?.productName || "Unknown"}</td>
                                <td>{txn.product?.category || "Unknown"}</td>
                                <td className={txn.type === "Stock In" ? "stock-in" : "stock-out"}>{txn.type}</td>
                                <td>{txn.batchNumber || "N/A"}</td>
                                <td>{txn.quantity}</td>
                                <td>{new Date(txn.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>



        </div>
    );
};

export default InventoryTransactions;
