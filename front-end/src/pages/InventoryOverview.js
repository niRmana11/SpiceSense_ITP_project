import React, { useState, useEffect } from "react";
import "../Styles/inventoryOverview.css";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import NavBar from "../components/navBar"; 
import backgroundImage from "../assets/background.png";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_URL = "http://localhost:5000/api";

const InventoryOverview = () => {
    const [stocks, setStocks] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [expiredItems, setExpiredItems] = useState([]);

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
        fetch(`${API_URL}/stocks/inventory`)
            .then(response => response.json())
            .then(data => {
                
                
                if (Array.isArray(data)) {
                    setStocks(data);
                    setLowStockItems(data.filter(item => item.quantity < 20));

                    
                    const expired = data.flatMap(item => 
                        item.expiredBatches.map(batch => ({
                            name: batch.name,
                            batchNumber: batch.batchNumber
                        }))
                    );
                    setExpiredItems(expired);
                } else {
                    console.error("Error: API response is not an array", data);
                    setStocks([]);
                }
            })
            .catch(error => console.error("Error fetching inventory data:", error));
    }, []);
    
    const chartData = {
        labels: stocks.map(item => item.name),
        datasets: [
            {
                label: "Stock Levels",
                data: stocks.map(item => item.quantity),
                backgroundColor: stocks.map(item => (item.quantity < 20 ? "#ff4d4d" : "#36a2eb")),
            }
        ]
    };

    return (
        <div>
            <NavBar /> 
            <div className="inventory-container">
                <h2>Inventory Overview</h2>

                {/* 🔹 Expired Products Alert Section */}
                {expiredItems.length > 0 && (
                    <div className="expired-alert">
                        <h3>Expired Products Alert</h3>
                        <ul>
                            {expiredItems.map((item, index) => (
                                <li key={index}>{item.name} batch {item.batchNumber} is expired</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 🔹 Low Stock Alert Section */}
                {lowStockItems.length > 0 && (
                    <div className="low-stock-alert">
                        <h3>Low Stock Alert</h3>
                        <ul>
                            {lowStockItems.map(item => (
                                <li key={item.id}>{item.name} is low on stock ({item.quantity} Kg)</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Quantity (Kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map(item => (
                            <tr key={item.id} className={item.quantity < 20 ? "low-stock" : ""}>
                                <td>{item.name}</td>
                                <td>{item.category}</td>
                                <td>{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="chart-container">
                    <h3>Stock Levels Report</h3>
                    <Bar data={chartData}/>
                </div>
            </div>
        </div>
    );
};

export default InventoryOverview;
