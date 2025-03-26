// pages/UserProfile.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import OrdersList from "../components/OrderList"; // Corrected to singular OrdersList
import NavigationBar from "../components/NavigationBar";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    shippingAddress: "",
    billingAddress: "",
    companyName: "",
    contactPerson: "",
    jobTitle: "",
    department: ""
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const passedUserData = location.state?.userData;
        if (passedUserData) {
          setUserData(passedUserData);
          initializeFormData(passedUserData);
          return;
        }
        const response = await axios.get("http://localhost:5000/api/user/data", {
          withCredentials: true,
        });
        if (response.data.success) {
          setUserData(response.data.userData);
          initializeFormData(response.data.userData);
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

  // Initialize form data with user data
  const initializeFormData = (user) => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      shippingAddress: user.shippingAddress || "",
      billingAddress: user.billingAddress || "",
      companyName: user.companyName || "",
      contactPerson: user.contactPerson || "",
      jobTitle: user.jobTitle || "",
      department: user.department || ""
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Start editing profile
  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateSuccess(false);
  };

  // Cancel editing and reset form
  const handleCancelClick = () => {
    setIsEditing(false);
    initializeFormData(userData);
  };

  // Submit form to update user profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Only send non-empty fields that have changed
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== "" && formData[key] !== userData[key]) {
          updateData[key] = formData[key];
        }
      });
      
      // Don't proceed if no changes were made
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setLoading(false);
        return;
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/user/update-profile`,
        updateData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUserData({...userData, ...updateData});
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        setIsEditing(false);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

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

  // Function to render role-specific form fields
  const renderRoleSpecificFormFields = () => {
    if (!userData) return null;

    switch (userData.role) {
      case "customer":
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Shipping Address</label>
              <textarea
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Billing Address</label>
              <textarea
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
          </>
        );
      case "supplier":
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </>
        );
      case "employee":
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <NavigationBar userData={userData} />
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
          {userData && <h1 className="text-3xl font-bold text-amber-700 mb-6">{userData.role} Profile</h1>}
          
          {/* Status messages */}
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          {updateSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">Profile updated successfully!</div>}
          
          {error && !userData ? (
            <p className="text-red-500">{error}</p>
          ) : userData ? (
            <>
              {!isEditing ? (
                <div className="space-y-4">
                  <p><strong>Name:</strong> {userData.name}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                  <p><strong>Phone:</strong> {userData.phone}</p>
                  <p><strong>Role:</strong> {userData.role}</p>
                  
                  {/* Render role-specific fields */}
                  {renderRoleSpecificFields()}
                  
                  <p><strong>Email Verified:</strong> {userData.isAccountVerified ? "Yes" : "No"}</p>
                  
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={handleEditClick}
                      className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
                    >
                      Edit Profile
                    </button>
                  </div>
                  
                  <OrdersList userId={userId} />
                  <Link to="/credit-cards">
                    <button className="mt-4 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
                      Manage My Credit Cards
                    </button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Email (cannot be changed)</label>
                    <input
                      type="email"
                      value={userData.email}
                      className="w-full p-2 border rounded bg-gray-100"
                      disabled
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  {/* Render role-specific form fields */}
                  {renderRoleSpecificFormFields()}
                  
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center py-8">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-3">Loading profile...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;