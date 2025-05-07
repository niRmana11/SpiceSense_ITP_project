import React, { useState, useEffect } from "react";
import "../Styles/inventoryOverview.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
                    setLowStockItems(data.filter(item => item.quantity < 50));


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


    // generate inventory overview report
    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Inventory Overview Report", 14, 22);

        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);


        const tableColumn = ["Name", "Category", "Quantity (Kg)"];
        const tableRows = [];

        stocks.filter(item => item.quantity > 0).forEach(item => {
            const rowData = [
                item.name || "Unknown",
                item.category || "Unknown",
                item.quantity || 0
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
        });

        if (expiredItems.length > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text("Expired Products Alert", 14, 20);

            expiredItems.forEach((item, index) => {
                doc.text(`${index + 1}. ${item.name} batch ${item.batchNumber} is expired`, 14, 30 + index * 10);
            });
        }

        if (lowStockItems.filter(item => item.quantity > 0).length > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text("Low Stock Alert", 14, 20);

            lowStockItems.filter(item => item.quantity > 0).forEach((item, index) => {
                doc.text(`${index + 1}. ${item.name} is low on stock (${item.quantity} Kg)`, 14, 30 + index * 10);
            });
        }

        doc.save("inventory_report.pdf");
    };




    const filteredStocks = stocks.filter(item => item.quantity > 0);

    const chartData = {
        labels: filteredStocks.map(item => item.name),
        datasets: [
            {
                label: "Stock Levels",
                data: filteredStocks.map(item => item.quantity),
                backgroundColor: filteredStocks.map(item => (item.quantity < 50 ? "#ff4d4d" : "#36a2eb")),
            }
        ]
    };



    return (
        <div>
            <NavBar />
            <div className="inventory-container">
                <h2>Inventory Overview</h2>


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


                {lowStockItems.filter(item => item.quantity > 0).length > 0 && (
                    <div className="low-stock-alert">
                        <h3>Low Stock Alert</h3>
                        <ul>
                            {lowStockItems.filter(item => item.quantity > 0).map(item => (
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
                        {stocks.filter(item => item.quantity > 0).map(item => (
                            <tr key={item.id} className={item.quantity < 50 ? "low-stock" : ""}>
                                <td>{item.name || "Unknown"}</td>
                                <td>{item.category || "Unknown"}</td>
                                <td>{item.quantity || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>


                <div className="chart-container">
                    <h3>Stock Levels Report</h3>
                    <Bar data={chartData} />
                </div>


                <hr style={{ margin: "30px 0", border: "none", borderTop: "1px solid #d59e76" }} />

                <button className="download-btn" onClick={generatePDF}>
                    Download Inventory Report (PDF)
                </button>

            </div>
        </div>
    );
};

export default InventoryOverview;
