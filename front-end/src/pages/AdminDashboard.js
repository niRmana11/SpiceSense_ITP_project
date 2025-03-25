import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import UserManagement from "../components/UserManagement"; // Import the UserManagement component

const AdminDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // Track active tab
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

  // Function to switch tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  // Render dashboard content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "dashboard":
      default:
        return (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-amber-700 mb-4">Dashboard Overview</h2>
              <p className="mb-2">Welcome to your admin dashboard, {userData?.name}!</p>
              <p className="mb-6">From here you can manage users, view reports, and control system settings.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-bold text-amber-800 mb-2">User Management</h3>
                  <p className="text-gray-600 mb-4">Manage users, roles, and permissions.</p>
                  <button 
                    onClick={() => switchTab("users")}
                    className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
                  >
                    Manage Users
                  </button>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-bold text-amber-800 mb-2">Inventory</h3>
                  <p className="text-gray-600 mb-4">Manage product inventory and stock levels.</p>
                  <button className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
                    View Inventory
                  </button>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-bold text-amber-800 mb-2">Orders</h3>
                  <p className="text-gray-600 mb-4">View and manage customer orders.</p>
                  <button className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl p-4 mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-amber-700">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        ) : userData ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white rounded-xl shadow-xl p-4 h-min">
              <div className="mb-6">
                <p className="font-medium text-gray-800">Logged in as:</p>
                <p className="text-amber-700 font-bold">{userData.name}</p>
                <p className="text-gray-500 text-sm">{userData.email}</p>
              </div>
              
              <nav>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => switchTab("dashboard")}
                      className={`w-full text-left px-4 py-2 rounded ${
                        activeTab === "dashboard" 
                          ? "bg-amber-100 text-amber-700 font-medium" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => switchTab("users")}
                      className={`w-full text-left px-4 py-2 rounded ${
                        activeTab === "users" 
                          ? "bg-amber-100 text-amber-700 font-medium" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      User Management
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                    >
                      Inventory
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                    >
                      Orders
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                    >
                      Reports
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                    >
                      Settings
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              {renderContent()}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-xl text-center">
            <p>Loading dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;