import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loading from './Loading';
import ConfirmDialog from './ConfirmDialog';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    // Role-specific fields
    companyName: '',
    contactPerson: '',
    jobTitle: '',
    department: '',
    shippingAddress: '',
    billingAddress: ''
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    userId: null
  });

  // Fetch users based on selected role
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (selectedRole === 'all') {
          response = await axios.get('http://localhost:5000/api/user/all', { withCredentials: true });
        } else {
          response = await axios.get(`http://localhost:5000/api/user/role/${selectedRole}`, { withCredentials: true });
        }
        
        if (response.data.success) {
          setUsers(response.data.users);
          setFilteredUsers(response.data.users);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedRole, updateSuccess, deleteSuccess]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const results = users.filter(user => 
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
    setSearchTerm('');
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setSearchTerm(''); // Clear search when changing roles
  };

  // Open update form with user data
  const handleUpdateClick = (user) => {
    setCurrentUser(user);
    
    // Populate form with user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      password: '', // Password is empty as we don't receive it from server
      companyName: user.companyName || '',
      contactPerson: user.contactPerson || '',
      jobTitle: user.jobTitle || '',
      department: user.department || '',
      shippingAddress: user.shippingAddress || '',
      billingAddress: user.billingAddress || ''
    });
    
    setShowUpdateForm(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit update form
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Only send non-empty fields
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          updateData[key] = formData[key];
        }
      });
      
      // Don't send empty password
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
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (userId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      userId
    });
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      
      const response = await axios.delete(
        `http://localhost:5000/api/user/delete/${confirmDialog.userId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  // Close update form
  const handleCloseForm = () => {
    setShowUpdateForm(false);
  };

  // Get role-specific fields
  const getRoleSpecificFields = () => {
    switch (formData.role) {
      case 'supplier':
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
      case 'employee':
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
      case 'customer':
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
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-amber-700 mb-4">User Management</h2>
      
      <div className="mb-6">
  <input
    type="text"
    placeholder="Search by name, email, or phone..."
    value={searchTerm}
    onChange={handleSearchChange}
    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
  />
</div>

      {/* Role filter tabs */}
      <div className="flex mb-6 border-b overflow-x-auto">
        <button
          onClick={() => handleRoleSelect('all')}
          className={`px-4 py-2 font-medium ${selectedRole === 'all' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-gray-500'}`}
        >
          All Users
        </button>
        <button
          onClick={() => handleRoleSelect('admin')}
          className={`px-4 py-2 font-medium ${selectedRole === 'admin' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-gray-500'}`}
        >
          Admins
        </button>
        <button
          onClick={() => handleRoleSelect('supplier')}
          className={`px-4 py-2 font-medium ${selectedRole === 'supplier' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-gray-500'}`}
        >
          Suppliers
        </button>
        <button
          onClick={() => handleRoleSelect('customer')}
          className={`px-4 py-2 font-medium ${selectedRole === 'customer' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-gray-500'}`}
        >
          Customers
        </button>
        <button
          onClick={() => handleRoleSelect('employee')}
          className={`px-4 py-2 font-medium ${selectedRole === 'employee' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-gray-500'}`}
        >
          Employees
        </button>
      </div>
      
      {/* Status messages */}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {updateSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">User updated successfully!</div>}
      {deleteSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">User deleted successfully!</div>}
      
      {/* User Table */}
      {loading ? (
        <Loading message="Loading users..." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Name</th>
                <th className="py-2 px-4 border text-left">Email</th>
                <th className="py-2 px-4 border text-left">Phone</th>
                <th className="py-2 px-4 border text-left">Role</th>
                <th className="py-2 px-4 border text-left">Role Details</th>
                <th className="py-2 px-4 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    {searchTerm ? 'No users found matching your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border">{user.name}</td>
                    <td className="py-2 px-4 border">{user.email}</td>
                    <td className="py-2 px-4 border">{user.phone}</td>
                    <td className="py-2 px-4 border capitalize">{user.role}</td>
                    <td className="py-2 px-4 border">
                      {user.role === 'supplier' && (
                        <>
                          <p><strong>Company:</strong> {user.companyName}</p>
                          <p><strong>Contact:</strong> {user.contactPerson}</p>
                        </>
                      )}
                      {user.role === 'employee' && (
                        <>
                          <p><strong>Job:</strong> {user.jobTitle}</p>
                          <p><strong>Dept:</strong> {user.department}</p>
                        </>
                      )}
                      {user.role === 'customer' && (
                        <>
                          <p><strong>Shipping:</strong> {user.shippingAddress}</p>
                          <p><strong>Billing:</strong> {user.billingAddress}</p>
                        </>
                      )}
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <button
                        onClick={() => handleUpdateClick(user)}
                        className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 mr-2"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => openDeleteDialog(user._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-amber-700">Update User</h3>
              <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700 text-xl">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit}>
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
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
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
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Password (leave blank to keep unchanged)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Only fill this if you want to change the user's password
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="supplier">Supplier</option>
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              
              {/* Role-specific fields */}
              {getRoleSpecificFields()}
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update User'}
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
        onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})}
      />
    </div>
  );
};

export default UserManagement;