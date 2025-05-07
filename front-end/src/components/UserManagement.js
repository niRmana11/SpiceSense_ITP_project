import React, { useState, useEffect } from "react";
import axios from "axios";
import Loading from "./Loading";
import "../Styles/UserManagement.css";

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="ginger-modal-overlay">
      <div className="ginger-modal">
        <div className="ginger-modal-header">
          <h3 className="ginger-modal-title">{title}</h3>
          <button onClick={onCancel} className="ginger-close-btn">×</button>
        </div>
        <div className="ginger-confirm-message">
          <p>{message}</p>
        </div>
        <div className="ginger-form-actions">
          <button onClick={onCancel} className="ginger-cancel-btn">
            Cancel
          </button>
          <button onClick={onConfirm} className="ginger-delete-btn">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false); // New state for create form
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    companyName: "",
    contactPerson: "",
    jobTitle: "",
    department: "",
    shippingAddress: "",
    billingAddress: "",
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false); // New state for create success
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    userId: null,
  });

  // Fetch users based on selected role
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (selectedRole === "all") {
          response = await axios.get("http://localhost:5000/api/user/all", {
            withCredentials: true,
          });
        } else {
          response = await axios.get(`http://localhost:5000/api/user/role/${selectedRole}`, {
            withCredentials: true,
          });
        }

        if (response.data.success) {
          setUsers(response.data.users || []);
          setFilteredUsers(response.data.users || []);
        } else {
          setError(response.data.message || "Failed to fetch users");
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Failed to fetch users";
        setError(errorMessage);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedRole, updateSuccess, deleteSuccess, createSuccess]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const results = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(lowercasedTerm) ||
          user.email?.toLowerCase().includes(lowercasedTerm) ||
          user.phone?.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredUsers(results);
    }
  }, [searchTerm, users]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setSearchTerm("");
  };

  // Open update form with user data
  const handleUpdateClick = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      password: "",
      companyName: user.companyName || "",
      contactPerson: user.contactPerson || "",
      jobTitle: user.jobTitle || "",
      department: user.department || "",
      shippingAddress: user.shippingAddress || "",
      billingAddress: user.billingAddress || "",
    });
    setShowUpdateForm(true);
  };

  // Open create form
  const handleCreateClick = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      password: "",
      companyName: "",
      contactPerson: "",
      jobTitle: "",
      department: "",
      shippingAddress: "",
      billingAddress: "",
    });
    setShowCreateForm(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit update form
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const updateData = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== "") {
          updateData[key] = formData[key];
        }
      });

      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await axios.put(
        `http://localhost:5000/api/user/update/${currentUser._id}`,
        updateData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        setShowUpdateForm(false);
      } else {
        setError(response.data.message || "Failed to update user");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update user";
      setError(errorMessage);
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit create form
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const createData = { ...formData };

      // Remove empty fields that are not required
      Object.keys(createData).forEach((key) => {
        if (createData[key] === "" && key !== "password") {
          delete createData[key];
        }
      });

      const response = await axios.post(
        "http://localhost:5000/api/user/create-user",
        createData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setCreateSuccess(true);
        setTimeout(() => setCreateSuccess(false), 3000);
        setShowCreateForm(false);
      } else {
        setError(response.data.message || "Failed to create user");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to create user";
      setError(errorMessage);
      console.error("Error creating user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (userId) => {
    if (!userId) {
      setError("Invalid user ID");
      return;
    }
    console.log("Opening delete dialog for userId:", userId);
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Delete",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      userId,
    });
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!confirmDialog.userId) {
      setError("No user selected for deletion");
      setConfirmDialog({ ...confirmDialog, isOpen: false });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(
        `http://localhost:5000/api/user/delete/${confirmDialog.userId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
      } else {
        setError(response.data.message || "Failed to delete user");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete user";
      setError(errorMessage);
      console.error("Error deleting user:", err);
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  // Close forms
  const handleCloseForm = () => {
    setShowUpdateForm(false);
    setShowCreateForm(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      password: "",
      companyName: "",
      contactPerson: "",
      jobTitle: "",
      department: "",
      shippingAddress: "",
      billingAddress: "",
    });
  };

  // Get role-specific fields
  const getRoleSpecificFields = () => {
    switch (formData.role) {
      case "supplier":
        return (
          <>
            <div className="ginger-form-group">
              <label className="ginger-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="ginger-input"
              />
            </div>
            <div className="ginger-form-group">
              <label className="ginger-label">Warehouse Location</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="ginger-input"
              />
            </div>
          </>
        );
      case "employee":
        return (
          <>
            <div className="ginger-form-group">
              <label className="ginger-label">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="ginger-input"
              />
            </div>
            <div className="ginger-form-group">
              <label className="ginger-label">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="ginger-input"
              />
            </div>
          </>
        );
      case "customer":
        return (
          <>
            <div className="ginger-form-group">
              <label className="ginger-label">Shipping Address</label>
              <textarea
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                className="ginger-textarea"
                rows="3"
              ></textarea>
            </div>
            <div className="ginger-form-group">
              <label className="ginger-label">Billing Address</label>
              <textarea
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                className="ginger-textarea"
                rows="3"
              ></textarea>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="ginger-container">
      <h2 className="ginger-title">User Management</h2>

      {/* Create New User Button */}
      <div className="ginger-create-button-container">
        <button onClick={handleCreateClick} className="ginger-create-btn">
          Create New User
        </button>
      </div>

      <div className="ginger-search-container">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="ginger-search-input"
        />
        {searchTerm && (
          <button onClick={handleClearSearch} className="ginger-clear-btn">
            ×
          </button>
        )}
      </div>

      {/* Role filter tabs */}
      <div className="ginger-tabs">
        <button
          onClick={() => handleRoleSelect("all")}
          className={`ginger-tab ${selectedRole === "all" ? "ginger-tab-active" : ""}`}
        >
          All Users
        </button>
        <button
          onClick={() => handleRoleSelect("admin")}
          className={`ginger-tab ${selectedRole === "admin" ? "ginger-tab-active" : ""}`}
        >
          Admins
        </button>
        <button
          onClick={() => handleRoleSelect("supplier")}
          className={`ginger-tab ${selectedRole === "supplier" ? "ginger-tab-active" : ""}`}
        >
          Suppliers
        </button>
        <button
          onClick={() => handleRoleSelect("customer")}
          className={`ginger-tab ${selectedRole === "customer" ? "ginger-tab-active" : ""}`}
        >
          Customers
        </button>
       
      </div>

      {/* Status messages */}
      {error && <div className="ginger-error">{error}</div>}
      {updateSuccess && <div className="ginger-success">User updated successfully!</div>}
      {deleteSuccess && <div className="ginger-success">User deleted successfully!</div>}
      {createSuccess && <div className="ginger-success">User created successfully!</div>}

      {/* User Table */}
      {loading ? (
        <Loading message="Loading users..." />
      ) : (
        <div className="ginger-table-wrapper">
          <table className="ginger-table">
            <thead className="ginger-table-header">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Role Details</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="ginger-no-results">
                    {searchTerm ? "No users found matching your search" : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="ginger-table-row">
                    <td>{user.name || "N/A"}</td>
                    <td>{user.email || "N/A"}</td>
                    <td>{user.phone || "N/A"}</td>
                    <td className="capitalize">{user.role || "N/A"}</td>
                    <td>
                      {user.role === "supplier" && (
                        <>
                          <p>
                            <strong>Company:</strong> {user.companyName || "N/A"}
                          </p>
                          <p>
                            <strong>Warehouse location</strong> {user.contactPerson || "N/A"}
                          </p>
                        </>
                      )}
                      {user.role === "employee" && (
                        <>
                          <p>
                            <strong>Job:</strong> {user.jobTitle || "N/A"}
                          </p>
                          <p>
                            <strong>Dept:</strong> {user.department || "N/A"}
                          </p>
                        </>
                      )}
                      {user.role === "customer" && (
                        <>
                          <p>
                            <strong>Shipping:</strong> {user.shippingAddress || "N/A"}
                          </p>
                          <p>
                            <strong>Billing:</strong> {user.billingAddress || "N/A"}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="ginger-actions">
                      <button onClick={() => handleUpdateClick(user)} className="ginger-update-btn">
                        Update
                      </button>
                      <button
                        onClick={() => openDeleteDialog(user._id)}
                        className="ginger-delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Update User Form Modal */}
      {showUpdateForm && (
        <div className="ginger-modal-overlay">
          <div className="ginger-modal">
            <div className="ginger-modal-header">
              <h3 className="ginger-modal-title">Update User</h3>
              <button onClick={handleCloseForm} className="ginger-close-btn">
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="ginger-form">
              <div className="ginger-form-group">
                <label className="ginger-label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="ginger-input"
                  required
                />
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="ginger-input"
                  required
                />
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="ginger-input"
                  required
                />
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Password (leave blank to keep unchanged)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="ginger-input"
                />
                <p className="ginger-hint">
                  Only fill this if you want to change the user's password
                </p>
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="ginger-select"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="supplier">Supplier</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              {getRoleSpecificFields()}

              <div className="ginger-form-actions">
                <button type="button" onClick={handleCloseForm} className="ginger-cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="ginger-submit-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Form Modal */}
      {showCreateForm && (
        <div className="ginger-modal-overlay">
          <div className="ginger-modal">
            <div className="ginger-modal-header">
              <h3 className="ginger-modal-title">Create New User</h3>
              <button onClick={handleCloseForm} className="ginger-close-btn">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="ginger-form">
              <div className="ginger-form-group">
                <label className="ginger-label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="ginger-input"
                  required
                />
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="ginger-input"
                  required
                />
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="ginger-input"
                  required
                />
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="ginger-input"
                  required
                />
              </div>

              <div className="ginger-form-group">
                <label className="ginger-label">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="ginger-select"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="supplier">Supplier</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              {getRoleSpecificFields()}

              <div className="ginger-form-actions">
                <button type="button" onClick={handleCloseForm} className="ginger-cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="ginger-submit-btn" disabled={loading}>
                  {loading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default UserManagement;