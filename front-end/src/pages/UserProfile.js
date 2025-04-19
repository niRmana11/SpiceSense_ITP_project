// pages/UserProfile.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import OrdersList from "../components/OrderList"; // Fixed typo in import
import NavigationBar from "../components/NavigationBar";
import "../Styles/UserProfileSpiced.css"; // New CSS file with spiced theme

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateSuccess(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    initializeFormData(userData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== "" && formData[key] !== userData[key]) {
          updateData[key] = formData[key];
        }
      });
      
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

  const renderRoleSpecificFields = () => {
    if (!userData) return null;

    switch (userData.role) {
      case "customer":
        return (
          <>
            <p className="profile-spiced-detail"><strong>Shipping Address:</strong> {userData.shippingAddress}</p>
            <p className="profile-spiced-detail"><strong>Billing Address:</strong> {userData.billingAddress}</p>
          </>
        );
      case "supplier":
        return (
          <>
            <p className="profile-spiced-detail"><strong>Company Name:</strong> {userData.companyName}</p>
            <p className="profile-spiced-detail"><strong>Contact Person:</strong> {userData.contactPerson}</p>
          </>
        );
      case "employee":
        return (
          <>
            <p className="profile-spiced-detail"><strong>Job Title:</strong> {userData.jobTitle}</p>
            <p className="profile-spiced-detail"><strong>Department:</strong> {userData.department}</p>
          </>
        );
      default:
        return null;
    }
  };

  const renderRoleSpecificFormFields = () => {
    if (!userData) return null;

    switch (userData.role) {
      case "customer":
        return (
          <>
            <div className="profile-spiced-form-group">
              <label className="profile-spiced-label">Shipping Address</label>
              <textarea
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                className="profile-spiced-textarea"
                rows="3"
              ></textarea>
            </div>
            <div className="profile-spiced-form-group">
              <label className="profile-spiced-label">Billing Address</label>
              <textarea
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                className="profile-spiced-textarea"
                rows="3"
              ></textarea>
            </div>
          </>
        );
      case "supplier":
        return (
          <>
            <div className="profile-spiced-form-group">
              <label className="profile-spiced-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="profile-spiced-input"
              />
            </div>
            <div className="profile-spiced-form-group">
              <label className="profile-spiced-label">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="profile-spiced-input"
              />
            </div>
          </>
        );
      case "employee":
        return (
          <>
            <div className="profile-spiced-form-group">
              <label className="profile-spiced-label">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="profile-spiced-input"
              />
            </div>
            <div className="profile-spiced-form-group">
              <label className="profile-spiced-label">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="profile-spiced-input"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-spiced-container">
      <NavigationBar userData={userData} />
      <div className="profile-spiced-content">
        <div className="profile-spiced-card">
          {userData && <h1 className="profile-spiced-title">{userData.role} Profile</h1>}
          
          {error && <div className="profile-spiced-error">{error}</div>}
          {updateSuccess && <div className="profile-spiced-success">Profile updated successfully!</div>}
          
          {error && !userData ? (
            <p className="profile-spiced-error-text">{error}</p>
          ) : userData ? (
            <>
              {!isEditing ? (
                <div className="profile-spiced-details">
                  <p className="profile-spiced-detail"><strong>Name:</strong> {userData.name}</p>
                  <p className="profile-spiced-detail"><strong>Email:</strong> {userData.email}</p>
                  <p className="profile-spiced-detail"><strong>Phone:</strong> {userData.phone}</p>
                  <p className="profile-spiced-detail"><strong>Role:</strong> {userData.role}</p>
                  
                  {renderRoleSpecificFields()}
                  
                  <p className="profile-spiced-detail"><strong>Email Verified:</strong> {userData.isAccountVerified ? "Yes" : "No"}</p>
                  
                  <div className="profile-spiced-buttons">
                    <button
                      onClick={handleEditClick}
                      className="profile-spiced-edit-btn"
                    >
                      Edit Profile
                    </button>
                  </div>
                  <Link to="/credit-cards">
                    <button className="profile-spiced-credit-btn">
                      Manage My Credit Cards
                    </button>
                  </Link>
                  <OrdersList userId={userId} />
                  
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="profile-spiced-form">
                  <div className="profile-spiced-form-group">
                    <label className="profile-spiced-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="profile-spiced-input"
                      required
                    />
                  </div>
                  
                  <div className="profile-spiced-form-group">
                    <label className="profile-spiced-label">Email (cannot be changed)</label>
                    <input
                      type="email"
                      value={userData.email}
                      className="profile-spiced-input profile-spiced-disabled"
                      disabled
                    />
                  </div>
                  
                  <div className="profile-spiced-form-group">
                    <label className="profile-spiced-label">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="profile-spiced-input"
                      required
                    />
                  </div>
                  
                  {renderRoleSpecificFormFields()}
                  
                  <div className="profile-spiced-form-buttons">
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      className="profile-spiced-cancel-btn"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="profile-spiced-save-btn"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="profile-spiced-loading">
              <div className="profile-spiced-spinner"></div>
              <p>Loading profile...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;