import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/searchFilter.css";
import NavBar from "../components/navBar";
import backgroundImage from "../assets/background.png";

const API_URL = "http://localhost:5000/api";

const SearchFilter = () => {
    const today = new Date();
    const [stocks, setStocks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [batchSearch, setBatchSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [expiryFilter, setExpiryFilter] = useState("");
    const [stockFilter, setStockFilter] = useState("");

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

    // Fetch stocks 
    useEffect(() => {
        axios.get(`${API_URL}/stocks/searchFilter`)
            .then(response => setStocks(response.data))
            .catch(error => console.error("Error fetching data:", error));
    }, []);

    // Get expiry status
    const getExpiryStatus = (expiryDate) => {
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "Expired";
        if (diffDays <= 30) return "Nearing Expiry";
        return "Safe";
    };

    // Filter stocks
    const filteredStocks = stocks.filter(stock => {
        const nameMatch = stock.product.productName.toLowerCase().includes(searchTerm.toLowerCase());
        const batchMatch = stock.batches.some(batch => batch.batchNumber.toLowerCase().includes(batchSearch.toLowerCase()));
        const categoryMatch = categoryFilter ? stock.product.category === categoryFilter : true;
        const expiryMatch = expiryFilter ? stock.batches.some(batch => getExpiryStatus(batch.expiryDate) === expiryFilter) : true;
        const stockMatch = stockFilter === "Low Stock" ? stock.totalQuantity < 10 :
            stockFilter === "Sufficient Stock" ? stock.totalQuantity >= 10 : true;

        return nameMatch && batchMatch && categoryMatch && expiryMatch && stockMatch;
    });

    return (
        <div>
            <NavBar /> 
        <div className="search-filter-container">
            <h2>Search & Filter</h2>

            <div className="search-inputs">
                <input type="text" placeholder="Search by Name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <input type="text" placeholder="Search by Batch No" value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)} />
                <select onChange={(e) => setCategoryFilter(e.target.value)} value={categoryFilter}>
                    <option value="">All Categories</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Finished Product">Finished Product</option>
                </select>
            </div>

            <div className="filter-options">
                <select onChange={(e) => setExpiryFilter(e.target.value)} value={expiryFilter}>
                    <option value="">All Expiry Status</option>
                    <option value="Expired">Expired</option>
                    <option value="Nearing Expiry">Nearing Expiry</option>
                    <option value="Safe">Safe</option>
                </select>
                <select onChange={(e) => setStockFilter(e.target.value)} value={stockFilter}>
                    <option value="">All Stock Levels</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Sufficient Stock">Sufficient Stock</option>
                </select>
            </div>

            <table className="stock-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Batch No</th>
                        <th>Category</th>
                        <th>Expiry Date</th>
                        <th>Stock Levels</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredStocks.map(stock => 
                        stock.batches.map(batch => (
                            <tr key={batch.batchNumber} className={getExpiryStatus(batch.expiryDate).toLowerCase().replace(" ", "-")}>
                                <td>{stock.product.productName}</td>
                                <td>{batch.batchNumber}</td>
                                <td>{stock.product.category}</td>
                                <td>{new Date(batch.expiryDate).toISOString().split("T")[0]}</td>
                                <td>{batch.quantity}</td>
                                <td>{getExpiryStatus(batch.expiryDate)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            </div>
            </div>
    );
};

export default SearchFilter;
