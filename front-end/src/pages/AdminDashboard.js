import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import UserManagement from "../components/UserManagement";
import AdminOrdersManagement from "../components/AdminOrdersManagement";
import SupplierProducts from "../components/SupplierProducts";
import AdminMessages from "../components/AdminMessages";
import AdminDeliveries from "../components/AdminDeliveries";
import AdminTransactions from "../components/AdminTransactions";
import FinancialReports from "../pages/FinancialReports";
import AccountManagement from "../pages/AccountManagement"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

  const generateUserSummaryReport = async () => {
    try {
      console.log("Fetching report data...");
      const response = await axios.get("http://localhost:5000/api/user/reports/summary", {
        withCredentials: true,
      });
      console.log("User Summary Report response:", response.data);

      if (response.data.success) {
        const { summary } = response.data;
        console.log("Summary data:", summary);

        // Initialize jsPDF
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        console.log("jsPDF instance created:", doc);

        // Verify autoTable
        if (!doc.autoTable) {
          autoTable(doc);
          console.log("autoTable applied to jsPDF instance");
        }

        // Add header
        doc.setFontSize(18);
        doc.text("User Summary Report", 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Admin: ${userData?.name || "Unknown"} (${userData?.email || "Unknown"})`, 14, 40);

        // Summary Table
        doc.setFontSize(14);
        doc.text("Summary Statistics", 14, 50);
        const summaryTable = [
          ["Total Users", summary?.total || 0],
          ["Admins", summary?.admins || 0],
          ["Suppliers", summary?.suppliers || 0],
          ["Customers", summary?.customers || 0],
          ["Employees", summary?.employees || 0],
          ["Active Users", summary?.active || 0],
          ["Deactivated Users", summary?.deactivated || 0],
        ];

        doc.autoTable({
          startY: 55,
          head: [["Metric", "Count"]],
          body: summaryTable,
          theme: "grid",
        });

        // Detailed User Tables by Role
        let currentY = doc.lastAutoTable.finalY + 10;

        // Admin Users
        if (summary.userDetails?.admins?.length > 0) {
          doc.setFontSize(14);
          doc.text("Admin Users", 14, currentY);
          doc.autoTable({
            startY: currentY + 5,
            head: [["Name", "Email", "Phone", "Status"]],
            body: summary.userDetails.admins.map((user) => [
              user.name,
              user.email,
              user.phone,
              user.isActive ? "Active" : "Deactivated",
            ]),
            theme: "grid",
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 60 },
              2: { cellWidth: 40 },
              3: { cellWidth: 30 },
            },
          });
          currentY = doc.lastAutoTable.finalY + 10;
        }

        // Supplier Users
        if (summary.userDetails?.suppliers?.length > 0) {
          doc.setFontSize(14);
          doc.text("Supplier Users", 14, currentY);
          doc.autoTable({
            startY: currentY + 5,
            head: [["Name", "Email", "Phone", "Company", "Status"]],
            body: summary.userDetails.suppliers.map((user) => [
              user.name,
              user.email,
              user.phone,
              user.companyName || "N/A",
              user.isActive ? "Active" : "Deactivated",
            ]),
            theme: "grid",
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 50 },
              2: { cellWidth: 30 },
              3: { cellWidth: 40 },
              4: { cellWidth: 30 },
            },
          });
          currentY = doc.lastAutoTable.finalY + 10;
        }

        // Customer Users
        if (summary.userDetails?.customers?.length > 0) {
          doc.setFontSize(14);
          doc.text("Customer Users", 14, currentY);
          doc.autoTable({
            startY: currentY + 5,
            head: [["Name", "Email", "Phone", "Shipping Address", "Status"]],
            body: summary.userDetails.customers.map((user) => [
              user.name,
              user.email,
              user.phone,
              user.shippingAddress || "N/A",
              user.isActive ? "Active" : "Deactivated",
            ]),
            theme: "grid",
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 50 },
              2: { cellWidth: 30 },
              3: { cellWidth: 40 },
              4: { cellWidth: 30 },
            },
          });
          currentY = doc.lastAutoTable.finalY + 10;
        }

        // Employee Users
        if (summary.userDetails?.employees?.length > 0) {
          doc.setFontSize(14);
          doc.text("Employee Users", 14, currentY);
          doc.autoTable({
            startY: currentY + 5,
            head: [["Name", "Email", "Phone", "Job Title", "Status"]],
            body: summary.userDetails.employees.map((user) => [
              user.name,
              user.email,
              user.phone,
              user.jobTitle || "N/A",
              user.isActive ? "Active" : "Deactivated",
            ]),
            theme: "grid",
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 50 },
              2: { cellWidth: 30 },
              3: { cellWidth: 40 },
              4: { cellWidth: 30 },
            },
          });
        }

        console.log("Saving PDF...");
        doc.save(`User_Summary_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      } else {
        setError(response.data.message || "Failed to fetch report data.");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setError(error.message || "Failed to generate report. Please try again.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "orders":
        return <AdminOrdersManagement />;
      case "suppliers":
        return <SupplierProducts />;
      case "messages":
        return <AdminMessages />;
      case "deliveries":
        return <AdminDeliveries />;
      case "transactions":
        return <AdminTransactions />;
      case "reports":
        return <FinancialReports />;
      case "account-management":
        return <AccountManagement />;
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
                  <button onClick={() => switchTab("users")} className="spice-action-btn">
                    Manage Users
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Account Management</h3>
                  <p className="spice-grid-desc">Activate or deactivate user accounts.</p>
                  <button onClick={() => switchTab("account-management")} className="spice-action-btn">
                    Manage Accounts
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Inventory</h3>
                  <p className="spice-grid-desc">Manage product inventory and stock levels.</p>
                  <button onClick={() => navigate("/inventory-overview")} className="spice-action-btn">
                    View Inventory
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Orders</h3>
                  <p className="spice-grid-desc">View and manage customer orders.</p>
                  <button onClick={() => switchTab("orders")} className="spice-action-btn">
                    View Orders
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">User Summary Report</h3>
                  <p className="spice-grid-desc">Generate user summary report.</p>
                  <button onClick={generateUserSummaryReport} className="spice-action-btn">
                    Generate User Summary Report
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Financial Reports</h3>
                  <p className="spice-grid-desc">View financial reports and sales data.</p>
                  <button onClick={() => switchTab("reports")} className="spice-action-btn">
                    View Reports
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Product Requests</h3>
                  <p className="spice-grid-desc">Send and manage product requests to suppliers.</p>
                  <button onClick={() => switchTab("messages")} className="spice-action-btn">
                    Manage Product Requests
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Delivery Tracking</h3>
                  <p className="spice-grid-desc">Monitor shipments and deliveries from suppliers.</p>
                  <button onClick={() => switchTab("deliveries")} className="spice-action-btn">
                    Track Supplier Deliveries
                  </button>
                </div>

                <div className="spice-grid-item">
                  <h3 className="spice-grid-title">Financial Transactions</h3>
                  <p className="spice-grid-desc">Manage payments and invoices for suppliers.</p>
                  <button onClick={() => switchTab("transactions")} className="spice-action-btn">
                    Manage Supplier Transactions
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
          <button onClick={handleLogout} className="spice-logout-btn">
            <span className="spice-logout-text">Logout</span>
            <span className="spice-logout-icon">→</span>
          </button>
        </div>
      </nav>

      {/* Rest of the Dashboard */}
      <div className="spice-content-wrapper">
        {error ? (
          <div className="spice-error-message">{error}</div>
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
                      className={`spice-nav-item ${activeTab === "dashboard" ? "spice-nav-active" : ""}`}
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("users")}
                      className={`spice-nav-item ${activeTab === "users" ? "spice-nav-active" : ""}`}
                    >
                      User Management
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("account-management")}
                      className={`spice-nav-item ${activeTab === "account-management" ? "spice-nav-active" : ""}`}
                    >
                      Account Management
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("orders")}
                      className={`spice-nav-item ${activeTab === "orders" ? "spice-nav-active" : ""}`}
                    >
                      Order Management
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/inventory-overview")}
                      className={`spice-nav-item ${
                        location.pathname === "/inventory-overview" ? "spice-nav-active" : ""
                      }`}
                    >
                      Inventory
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("messages")}
                      className={`spice-nav-item ${activeTab === "messages" ? "spice-nav-active" : ""}`}
                    >
                      Product Requests
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("deliveries")}
                      className={`spice-nav-item ${activeTab === "deliveries" ? "spice-nav-active" : ""}`}
                    >
                      Supplier Deliveries
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("transactions")}
                      className={`spice-nav-item ${activeTab === "transactions" ? "spice-nav-active" : ""}`}
                    >
                      Supplier Transactions
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("reports")}
                      className={`spice-nav-item ${activeTab === "reports" ? "spice-nav-active" : ""}`}
                    >
                      Financial Reports
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={generateUserSummaryReport}
                      className="spice-nav-item"
                    >
                      Generate User Report
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Main Content */}
            <div className="spice-content">{renderContent()}</div>
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