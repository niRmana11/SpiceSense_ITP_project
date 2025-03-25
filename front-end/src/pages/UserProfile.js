import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import OrdersList from "../components/OrderList";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = sessionStorage.getItem("userId");

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
        setError("Failed to load profile. Please log in again.");
        navigate("/login");
      }
    };
    fetchUserData();
  }, [navigate, location.state]);

  // Function to render role-specific fields
  const renderRoleSpecificFields = () => {
    if (!userData) return null;

    switch (userData.role) {
      case "customer":
        return (
          <>
            <p><strong>Shipping Address:</strong> {userData.shippingAddress}</p>
            <p><strong>Billing Address:</strong> {userData.billingAddress}</p>
          </>
        );
      case "supplier":
        return (
          <>
            <p><strong>Company Name:</strong> {userData.companyName}</p>
            <p><strong>Contact Person:</strong> {userData.contactPerson}</p>
          </>
        );
      case "employee":
        return (
          <>
            <p><strong>Job Title:</strong> {userData.jobTitle}</p>
            <p><strong>Department:</strong> {userData.department}</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
        {userData && <h1 className="text-3xl font-bold text-amber-700 mb-6">{userData.role} Profile</h1>}
        
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : userData ? (
          <div className="space-y-4">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>phone:</strong> {userData.phone}</p>
            <p><strong>Role:</strong> {userData.role}</p>
            
            {/* Render role-specific fields */}
            {renderRoleSpecificFields()}
            
            <p><strong>Email Verified:</strong> {userData.isAccountVerified ? "Yes" : "No"}</p>
            
            <button
              onClick={() => navigate("/home", { state: { userData } })}
              className="mt-4 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Back to Home
            </button>
            <OrdersList userId={userId} />
      <Link to="/credit-cards">
        <button>Manage My Credit Cards</button>
      </Link>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </div>
    

  );
};




export default UserProfile;