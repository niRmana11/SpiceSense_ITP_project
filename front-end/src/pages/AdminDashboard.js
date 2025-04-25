import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import UserManagement from "../components/UserManagement";
import AdminOrdersManagement from "../components/AdminOrdersManagement"; // Import the new component
import "../Styles/AdminNav.css";

const AdminDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const passedUserData = location.state?.userData;
        if (passedUserData) {
          setUserData(passedUserData);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/user/data", {
          withCredentials: true,
        });

        if (response.data.success) {
          setUserData(response.data.userData);
        } else {
          setError(response.data.message);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data?.message || error.message);
        setError("Failed to load dashboard. Please log in again.");
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate, location.state]);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      navigate("/welcome");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "orders": // New case for orders management
        return <AdminOrdersManagement />;
      case "dashboard":
      default:
        return (
          <div className="spice-dashboard-content">
            <div className="spice-card">
              <h2 className="spice-card-title">Dashboard Overview</h2>
              <p className="spice-welcome-text">Welcome to your admin dashboard, {userData?.name}!</p>
              <p className="spice-info-text">From here you can manage users, view reports, and control system settings.</p>
             
              <div className="spice-grid">
                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">User Management</h3>
                  <p className="spice-grid-desc">Manage users, roles, and permissions.</p>
                  <button
                    onClick={() => switchTab("users")}
                    className="spice-action-btn"
                  >
                    Manage Users
                  </button>
                </div>
               
                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Inventory</h3>
                  <p className="spice-grid-desc">Manage product inventory and stock levels.</p>
                  <button
                    onClick={() => navigate("/inventory-overview")}
                    className="spice-action-btn"
                  >
                    View Inventory
                  </button>
                </div>
               
                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Orders</h3>
                  <p className="spice-grid-desc">View and manage customer orders.</p>
                  <button 
                    onClick={() => switchTab("orders")} // Updated to use switchTab
                    className="spice-action-btn"
                  >
                    View Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="spice-dashboard-container">
      {/* Navigation Bar */}
      <nav className="spice-nav">
        <div className="spice-nav-logo">
          <div className="spice-logo-circle">
            <span className="spice-logo-text">AD</span>
          </div>
          <h1 className="spice-nav-title">Admin Dashboard</h1>
        </div>

        <div className="spice-nav-actions">
          <span className="spice-user-greeting">Hello, {userData?.name}</span>
          <button
            onClick={handleLogout}
            className="spice-logout-btn"
          >
            <span className="spice-logout-text">Logout</span>
            <span className="spice-logout-icon">→</span>
          </button>
        </div>
      </nav>

      {/* Rest of the Dashboard */}
      <div className="spice-content-wrapper">
        {error ? (
          <div className="spice-error-message">
            {error}
          </div>
        ) : userData ? (
          <div className="spice-main-layout">
            {/* Sidebar */}
            <div className="spice-sidebar">
              <div className="spice-user-info">
                <p className="spice-user-label">Logged in as:</p>
                <p className="spice-user-name">{userData.name}</p>
                <p className="spice-user-email">{userData.email}</p>
              </div>
             
              <nav className="spice-sidebar-nav">
                <ul className="spice-nav-list">
                  <li>
                    <button
                      onClick={() => switchTab("dashboard")}
                      className={`spice-nav-item ${
                        activeTab === "dashboard" ? "spice-nav-active" : ""
                      }`}
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("users")}
                      className={`spice-nav-item ${
                        activeTab === "users" ? "spice-nav-active" : ""
                      }`}
                    >
                      User Management
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("orders")}
                      className={`spice-nav-item ${
                        activeTab === "orders" ? "spice-nav-active" : ""
                      }`}
                    >
                      Order Management
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/inventory-overview")}
                      className="spice-nav-item"
                    >
                      Inventory
                    </button>
                  </li>
                  <li>
                    <button className="spice-nav-item">
                      Reports
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
           
            {/* Main Content */}
            <div className="spice-content">
              {renderContent()}
            </div>
          </div>
        ) : (
          <div className="spice-loading">
            <p>Loading dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
