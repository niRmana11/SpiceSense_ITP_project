// pages/UserProfile.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import OrdersList from "../components/OrderList";
import NavigationBar from "../components/NavigationBar";
import "../Styles/UserProfileSpiced.css";

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
    department: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      department: user.department || "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    } else if (!/^\+?\d{10,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      errors.phone = "Invalid phone number (10-15 digits)";
    }
    if (userData?.role === "customer") {
      if (!formData.shippingAddress.trim()) errors.shippingAddress = "Shipping address is required";
      if (!formData.billingAddress.trim()) errors.billingAddress = "Billing address is required";
    }
    if (userData?.role === "supplier") {
      if (!formData.companyName.trim()) errors.companyName = "Company name is required";
      if (!formData.contactPerson.trim()) errors.contactPerson = "Contact person is required";
    }
    if (userData?.role === "employee") {
      if (!formData.jobTitle.trim()) errors.jobTitle = "Job title is required";
      if (!formData.department.trim()) errors.department = "Department is required";
    }
    return errors;
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateSuccess(false);
    setFormErrors({});
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    initializeFormData(userData);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {};
      Object.keys(formData).forEach((key) => {
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
        setUserData({ ...userData, ...updateData });
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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      sessionStorage.removeItem("userId");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const renderRoleSpecificFields = () => {
    if (!userData) return null;
    return (
      <>
        {userData.role === "customer" && (
          <>
            <p className="profile-spiced-detail"><span className="profile-spiced-icon">📍</span><strong>Shipping Address:</strong> {userData.shippingAddress}</p>
            <p className="profile-spiced-detail"><span className="profile-spiced-icon">💳</span><strong>Billing Address:</strong> {userData.billingAddress}</p>
          </>
        )}
        {userData.role === "supplier" && (
          <>
            <p className="profile-spiced-detail"><span className="profile-spiced-icon">🏢</span><strong>Company Name:</strong> {userData.companyName}</p>
            <p className="profile-spiced-detail"><span className="profile-spiced-icon">👤</span><strong>Contact Person:</strong> {userData.contactPerson}</p>
          </>
        )}
        {userData.role === "employee" && (
          <>
            <p className="profile-spiced-detail"><span className="profile-spiced-icon">💼</span><strong>Job Title:</strong> {userData.jobTitle}</p>
            <p className="profile-spiced-detail"><span className="profile-spiced-icon">🏬</span><strong>Department:</strong> {userData.department}</p>
          </>
        )}
      </>
    );
  };

  const renderRoleSpecificFormFields = () => {
    if (!userData) return null;
    return (
      <>
        {userData.role === "customer" && (
          <>
            <div className="profile-spiced-form-group">
              <label htmlFor="shippingAddress" className="profile-spiced-label">Shipping Address</label>
              <textarea
                id="shippingAddress"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                className={`profile-spiced-textarea ${formErrors.shippingAddress ? "profile-spiced-input-error" : ""}`}
                rows="3"
                aria-invalid={formErrors.shippingAddress ? "true" : "false"}
              ></textarea>
              {formErrors.shippingAddress && <span className="profile-spiced-error-message">{formErrors.shippingAddress}</span>}
            </div>
            <div className="profile-spiced-form-group">
              <label htmlFor="billingAddress" className="profile-spiced-label">Billing Address</label>
              <textarea
                id="billingAddress"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                className={`profile-spiced-textarea ${formErrors.billingAddress ? "profile-spiced-input-error" : ""}`}
                rows="3"
                aria-invalid={formErrors.billingAddress ? "true" : "false"}
              ></textarea>
              {formErrors.billingAddress && <span className="profile-spiced-error-message">{formErrors.billingAddress}</span>}
            </div>
          </>
        )}
        {userData.role === "supplier" && (
          <>
            <div className="profile-spiced-form-group">
              <label htmlFor="companyName" className="profile-spiced-label">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`profile-spiced-input ${formErrors.companyName ? "profile-spiced-input-error" : ""}`}
                aria-invalid={formErrors.companyName ? "true" : "false"}
              />
              {formErrors.companyName && <span className="profile-spiced-error-message">{formErrors.companyName}</span>}
            </div>
            <div className="profile-spiced-form-group">
              <label htmlFor="contactPerson" className="profile-spiced-label">Contact Person</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className={`profile-spiced-input ${formErrors.contactPerson ? "profile-spiced-input-error" : ""}`}
                aria-invalid={formErrors.contactPerson ? "true" : "false"}
              />
              {formErrors.contactPerson && <span className="profile-spiced-error-message">{formErrors.contactPerson}</span>}
            </div>
          </>
        )}
        {userData.role === "employee" && (
          <>
            <div className="profile-spiced-form-group">
              <label htmlFor="jobTitle" className="profile-spiced-label">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className={`profile-spiced-input ${formErrors.jobTitle ? "profile-spiced-input-error" : ""}`}
                aria-invalid={formErrors.jobTitle ? "true" : "false"}
              />
              {formErrors.jobTitle && <span className="profile-spiced-error-message">{formErrors.jobTitle}</span>}
            </div>
            <div className="profile-spiced-form-group">
              <label htmlFor="department" className="profile-spiced-label">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`profile-spiced-input ${formErrors.department ? "profile-spiced-input-error" : ""}`}
                aria-invalid={formErrors.department ? "true" : "false"}
              />
              {formErrors.department && <span className="profile-spiced-error-message">{formErrors.department}</span>}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="profile-spiced-container">
      <NavigationBar userData={userData} />

      <section className="profile-spiced-hero">
        {/* <img
          src="https://via.placeholder.com/150?text=Avatar"
          alt="User profile avatar"
          className="profile-spiced-avatar"
        /> */}
        <h1 className="profile-spiced-hero-title">
          {userData ? `${userData.name}'s Profile` : "Loading Profile..."}
        </h1>
        <p className="profile-spiced-hero-text">
          Manage your account details, orders, and more.
        </p>
      </section>

      <div className="profile-spiced-main">
        <aside className={`profile-spiced-sidebar ${sidebarOpen ? "open" : ""}`}>
          <button className="profile-spiced-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? "×" : "☰"}
          </button>
          <nav className="profile-spiced-sidebar-nav">
            <button
              className="profile-spiced-sidebar-link"
              onClick={() => document.getElementById("profile-details").scrollIntoView({ behavior: "smooth" })}
            >
              Profile Details
            </button>
            <button
              className="profile-spiced-sidebar-link"
              onClick={() => document.getElementById("orders").scrollIntoView({ behavior: "smooth" })}
            >
              My Orders
            </button>
            <Link to="/credit-cards" className="profile-spiced-sidebar-link">
              Manage Credit Cards
            </Link>
            <Link to="/deliveries" className="profile-spiced-sidebar-link">
              Delivery Tracking
            </Link>
            <button className="profile-spiced-sidebar-link profile-spiced-logout" onClick={handleLogout}>
              Log Out
            </button>
          </nav>
        </aside>

        <main className="profile-spiced-content">
          <section id="profile-details" className="profile-spiced-section">
            <h2 className="profile-spiced-section-title">{userData?.role} Profile</h2>
            <div className="profile-spiced-card">
              {error && <div className="profile-spiced-error">{error}</div>}
              {updateSuccess && <div className="profile-spiced-success">Profile updated successfully!</div>}

              {userData ? (
                <>
                  {!isEditing ? (
                    <div className="profile-spiced-details">
                      <p className="profile-spiced-detail"><span className="profile-spiced-icon">👤</span><strong>Name:</strong> {userData.name}</p>
                      <p className="profile-spiced-detail"><span className="profile-spiced-icon">📧</span><strong>Email:</strong> {userData.email}</p>
                      <p className="profile-spiced-detail"><span className="profile-spiced-icon">📱</span><strong>Phone:</strong> {userData.phone}</p>
                      <p className="profile-spiced-detail"><span className="profile-spiced-icon">🎭</span><strong>Role:</strong> {userData.role}</p>
                      {renderRoleSpecificFields()}
                      <p className="profile-spiced-detail"><span className="profile-spiced-icon">✅</span><strong>Email Verified:</strong> {userData.isAccountVerified ? "Yes" : "No"}</p>
                      <button onClick={handleEditClick} className="profile-spiced-edit-btn">
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="profile-spiced-form">
                      <div className="profile-spiced-form-group">
                        <label htmlFor="name" className="profile-spiced-label">Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`profile-spiced-input ${formErrors.name ? "profile-spiced-input-error" : ""}`}
                          aria-invalid={formErrors.name ? "true" : "false"}
                        />
                        {formErrors.name && <span className="profile-spiced-error-message">{formErrors.name}</span>}
                      </div>
                      <div className="profile-spiced-form-group">
                        <label htmlFor="email" className="profile-spiced-label">Email (cannot be changed)</label>
                        <input
                          type="email"
                          id="email"
                          value={userData.email}
                          className="profile-spiced-input profile-spiced-disabled"
                          disabled
                        />
                      </div>
                      <div className="profile-spiced-form-group">
                        <label htmlFor="phone" className="profile-spiced-label">Phone</label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`profile-spiced-input ${formErrors.phone ? "profile-spiced-input-error" : ""}`}
                          aria-invalid={formErrors.phone ? "true" : "false"}
                        />
                        {formErrors.phone && <span className="profile-spiced-error-message">{formErrors.phone}</span>}
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
          </section>

          <section id="orders" className="profile-spiced-section">
            <h2 className="profile-spiced-section-title">My Orders</h2>
            <OrdersList userId={userId} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;