import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import "../Styles/AccountManagement.css";

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="acct-mgmt-modal-overlay">
      <div className="acct-mgmt-modal">
        <div className="acct-mgmt-modal-header">
          <h3 className="acct-mgmt-modal-title">{title}</h3>
          <button onClick={onCancel} className="acct-mgmt-close-btn">×</button>
        </div>
        <div className="acct-mgmt-confirm-message">
          <p>{message}</p>
        </div>
        <div className="acct-mgmt-form-actions">
          <button onClick={onCancel} className="acct-mgmt-cancel-btn">
            Cancel
          </button>
          <button onClick={onConfirm} className="acct-mgmt-confirm-btn">
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
  const [selectedStatus, setSelectedStatus] = useState("all");
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
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch users";
        setError(errorMessage);
        console.error("Error fetching users:", err);
        if (err.response?.status === 401) {
          navigate("/login", { state: { from: "/admin" } });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedRole, updateSuccess, navigate]);

  // Filter users based on search term, role, and status
  useEffect(() => {
    let results = [...users];

    // Apply search term filter
    if (searchTerm.trim() !== "") {
      const lowercasedTerm = searchTerm.toLowerCase();
      results = results.filter(
        (user) =>
          user.name?.toLowerCase().includes(lowercasedTerm) ||
          user.email?.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Apply status filter
    if (selectedStatus === "active") {
      results = results.filter((user) => user.isActive === true);
    } else if (selectedStatus === "deactivated") {
      results = results.filter((user) => user.isActive === false);
    }

    setFilteredUsers(results);
  }, [users, searchTerm, selectedStatus]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search and reset filters
  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedStatus("all");
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setSearchTerm("");
    setSelectedStatus("all");
  };

  // Handle status selection
  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setSearchTerm("");
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
    <div className="acct-mgmt-container">
      <h2 className="acct-mgmt-title">Account Management</h2>

      <div className="acct-mgmt-search-container">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="acct-mgmt-search-input"
        />
        {searchTerm && (
          <button onClick={handleClearSearch} className="acct-mgmt-clear-btn">
            ×
          </button>
        )}
      </div>

      {/* Role filter tabs */}
      <div className="acct-mgmt-filter-group">
        <h3 className="acct-mgmt-filter-title">Filter by Role</h3>
        <div className="acct-mgmt-tabs">
          <button
            onClick={() => handleRoleSelect("all")}
            className={`acct-mgmt-tab ${
              selectedRole === "all" ? "acct-mgmt-tab-active" : ""
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => handleRoleSelect("admin")}
            className={`acct-mgmt-tab ${
              selectedRole === "admin" ? "acct-mgmt-tab-active" : ""
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => handleRoleSelect("supplier")}
            className={`acct-mgmt-tab ${
              selectedRole === "supplier" ? "acct-mgmt-tab-active" : ""
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => handleRoleSelect("customer")}
            className={`acct-mgmt-tab ${
              selectedRole === "customer" ? "acct-mgmt-tab-active" : ""
            }`}
          >
            Customers
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="acct-mgmt-filter-group">
        <h3 className="acct-mgmt-filter-title">Filter by Status</h3>
        <div className="acct-mgmt-tabs acct-mgmt-status-tabs">
          <button
            onClick={() => handleStatusSelect("all")}
            className={`acct-mgmt-tab ${
              selectedStatus === "all" ? "acct-mgmt-tab-active" : ""
            }`}
          >
            All Statuses
          </button>
          <button
            onClick={() => handleStatusSelect("active")}
            className={`acct-mgmt-tab ${
              selectedStatus === "active" ? "acct-mgmt-tab-active" : ""
            }`}
          >
            Active Accounts
          </button>
          <button
            onClick={() => handleStatusSelect("deactivated")}
            className={`acct-mgmt-tab ${
              selectedStatus === "deactivated" ? "acct-mgmt-tab-active" : ""
            }`}
          >
            Deactivated Accounts
          </button>
        </div>
      </div>

      {/* Status messages */}
      {error && <div className="acct-mgmt-error">{error}</div>}
      {updateSuccess && (
        <div className="acct-mgmt-success">Account status updated successfully!</div>
      )}

      {/* User Table */}
      {loading ? (
        <Loading message="Loading users..." />
      ) : (
        <div className="acct-mgmt-table-wrapper">
          <table className="acct-mgmt-table">
            <thead className="acct-mgmt-table-header">
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
                  <td colSpan="5" className="acct-mgmt-no-results">
                    {searchTerm
                      ? "No users found matching your search"
                      : selectedStatus !== "all"
                      ? `No ${selectedStatus} users found`
                      : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="acct-mgmt-table-row">
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className="acct-mgmt-capitalize">{user.role}</td>
                    <td>{user.isActive ? "Active" : "Deactivated"}</td>
                    <td className="acct-mgmt-actions">
                      <button
                        onClick={() =>
                          openConfirmDialog(
                            user._id,
                            user.isActive ? "deactivate" : "activate"
                          )
                        }
                        className={`acct-mgmt-action-btn ${
                          user.isActive
                            ? "acct-mgmt-deactivate-btn"
                            : "acct-mgmt-activate-btn"
                        }`}
                        disabled={user.role === "admin" && user.isActive}
                        title={
                          user.role === "admin" && user.isActive
                            ? "Cannot deactivate active admin accounts"
                            : ""
                        }
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
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default AccountManagement;