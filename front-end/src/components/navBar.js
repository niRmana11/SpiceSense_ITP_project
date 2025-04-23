import React from "react";
import { Link } from "react-router-dom";
import "../Styles/navBar.css";

const navBar = () => {
    return (
        <nav className="navbar">
            <div className="nav-links">
                <Link to="/inventory-overview">Inventory Overview</Link>
                <Link to="/stock-levels">Stock Levels</Link>
                <Link to="/expiry-alerts">Expiry Alerts</Link>
                <Link to="/inventory-transactions">Transactions</Link>
                <Link to="/search-filter">Search & Filter</Link>
                <Link to="/admin-products">Add Product</Link>
            </div>
            <div className="admin-button-container">
                <Link to="/admin-dashboard" className="admin-button">
                    Admin Dashboard
                </Link>
            </div>
        </nav>
    );
};

export default navBar;
