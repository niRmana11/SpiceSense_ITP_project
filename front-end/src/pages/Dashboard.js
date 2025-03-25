// 3. Update Dashboard.js to handle routing more robustly
// SPICESENSE/front-end/src/pages/Dashboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Add a small delay to ensure cookies are properly set
        setTimeout(async () => {
          try {
            const response = await axios.get("http://localhost:5000/api/user/data", {
              withCredentials: true,
            });

            console.log("Dashboard user data response:", response.data);

            if (response.data.success) {
              const user = response.data.userData;

              // Redirect based on role
              switch (user.role) {
                case "customer":
                  navigate("/home", { state: { userData: user } });
                  break;
                case "admin":
                  navigate("/admin-dashboard", { state: { userData: user } });
                  break;
                case "supplier":
                  navigate("/supplier-dashboard", { state: { userData: user } });
                  break;
                case "employee":
                  navigate("/employee-dashboard", { state: { userData: user } });
                  break;
                default:
                  setError("Unknown role");
                  navigate("/login");
              }
            } else {
              setError(response.data.message);
              navigate("/login");
            }
          } catch (error) {
            console.error("Error fetching user data:", error.response?.data?.message || error.message);
            setError("Failed to load user data. Please log in again.");
            navigate("/login");
          } finally {
            setLoading(false);
          }
        }, 500); // Short delay to ensure cookies are set
      } catch (error) {
        setLoading(false);
        setError("An unexpected error occurred");
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100">
      {loading ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-700 mb-4">Loading...</h1>
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        error && <p className="text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Dashboard;