import React from "react";
import { Link } from "react-router-dom";
import "../Styles/navBar.css";

const navBar = () => {
    return (
        <nav className="navbar">
            <Link to="/inventory-overview">Inventory Overview</Link>
            <Link to="/stock-levels">Stock Levels</Link>
            <Link to="/expiry-alerts">Expiry Alerts</Link>
            <Link to="/inventory-transactions">Transactions</Link>
            <Link to="/search-filter">Search & Filter</Link>
            <Link to="/admin-products">Add Product</Link>
        </nav>
    );
};

export default navBar;
