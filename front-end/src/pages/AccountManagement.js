import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading"; // Reuse the Loading component


const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="spice-modal-overlay">
      <div className="spice-modal">
        <div className="spice-modal-header">
          <h3 className="spice-modal-title">{title}</h3>
          <button onClick={onCancel} className="spice-close-btn">×</button>
        </div>
        <div className="spice-confirm-message">
          <p>{message}</p>
        </div>
        <div className="spice-form-actions">
          <button onClick={onCancel} className="spice-cancel-btn">
            Cancel
          </button>
          <button onClick={onConfirm} className="spice-confirm-btn">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    userId: null,
    action: "", // "activate" or "deactivate"
  });
  const navigate = useNavigate();

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
          response = await axios.get(
            `http://localhost:5000/api/user/role/${selectedRole}`,
            { withCredentials: true }
          );
        }

        console.log("Fetch users response:", response.data);

        if (response.data.success) {
          setUsers(response.data.users);
          setFilteredUsers(response.data.users);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch users";
        setError(errorMessage);
        console.error("Error fetching users:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedRole, updateSuccess, navigate]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const results = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(lowercasedTerm) ||
          user.email?.toLowerCase().includes(lowercasedTerm)
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
    setSearchTerm(""); // Clear search when changing roles
  };

  // Handle activate/deactivate
  const handleToggleStatus = async () => {
    try {
      setLoading(true);

      const response = await axios.put(
        `http://localhost:5000/api/user/toggle-status/${confirmDialog.userId}`,
        { isActive: confirmDialog.action === "activate" },
        { withCredentials: true }
      );

      console.log("Toggle status response:", response.data);

      if (response.data.success) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        setUsers(
          users.map((user) =>
            user._id === confirmDialog.userId
              ? { ...user, isActive: confirmDialog.action === "activate" }
              : user
          )
        );
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update account status");
      console.error("Error updating account status:", err);
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  // Open confirmation dialog for activate/deactivate
  const openConfirmDialog = (userId, action) => {
    setConfirmDialog({
      isOpen: true,
      title: `Confirm ${action === "activate" ? "Activation" : "Deactivation"}`,
      message: `Are you sure you want to ${
        action === "activate" ? "activate" : "deactivate"
      } this user's account?`,
      userId,
      action,
    });
  };

  return (
    <div className="spice-container">
      <h2 className="spice-title">Account Management</h2>

      <div className="spice-search-container">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="spice-search-input"
        />
        {searchTerm && (
          <button onClick={handleClearSearch} className="spice-clear-btn">
            ×
          </button>
        )}
      </div>

      {/* Role filter tabs */}
      <div className="spice-tabs">
        <button
          onClick={() => handleRoleSelect("all")}
          className={`spice-tab ${
            selectedRole === "all" ? "spice-tab-active" : ""
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => handleRoleSelect("admin")}
          className={`spice-tab ${
            selectedRole === "admin" ? "spice-tab-active" : ""
          }`}
        >
          Admins
        </button>
        <button
          onClick={() => handleRoleSelect("supplier")}
          className={`spice-tab ${
            selectedRole === "supplier" ? "spice-tab-active" : ""
          }`}
        >
          Suppliers
        </button>
        <button
          onClick={() => handleRoleSelect("customer")}
          className={`spice-tab ${
            selectedRole === "customer" ? "spice-tab-active" : ""
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => handleRoleSelect("employee")}
          className={`spice-tab ${
            selectedRole === "employee" ? "spice-tab-active" : ""
          }`}
        >
          Employees
        </button>
      </div>

      {/* Status messages */}
      {error && <div className="spice-error">{error}</div>}
      {updateSuccess && (
        <div className="spice-success">Account status updated successfully!</div>
      )}

      {/* User Table */}
      {loading ? (
        <Loading message="Loading users..." />
      ) : (
        <div className="spice-table-wrapper">
          <table className="spice-table">
            <thead className="spice-table-header">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="spice-no-results">
                    {searchTerm
                      ? "No users found matching your search"
                      : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="spice-table-row">
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className="capitalize">{user.role}</td>
                    <td>{user.isActive ? "Active" : "Deactivated"}</td>
                    <td className="spice-actions">
                      <button
                        onClick={() =>
                          openConfirmDialog(
                            user._id,
                            user.isActive ? "deactivate" : "activate"
                          )
                        }
                        className={`spice-action-btn ${
                          user.isActive
                            ? "spice-deactivate-btn"
                            : "spice-activate-btn"
                        }`}
                        disabled={user.role === "admin" && user.isActive}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleToggleStatus}
        onCancel={() =>
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      />
    </div>
  );
};

export default AccountManagement;