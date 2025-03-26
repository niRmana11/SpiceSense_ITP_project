import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(""); // Added phone error state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const navigate = useNavigate();

  // Check password match on change
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(password === value);
  };

  // Validate phone number
  const validatePhone = (phoneNumber) => {
    // Regex to match:
    // 1. Optional country code (+ followed by digits)
    // 2. 10 digits number (like 0712345678)
    const phoneRegex = /^(\+\d{1,4})?[ -]?\d{10}$/;
    
    if (!phoneNumber) {
      setPhoneError("Phone number is required");
      return false;
    } else if (!phoneRegex.test(phoneNumber)) {
      setPhoneError("Invalid phone format. Use +[country code] followed by 10 digits or just 10 digits");
      return false;
    }
    
    setPhoneError("");
    return true;
  };

  // Handle phone change
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    validatePhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate password match before submitting
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPasswordMatch(false);
      setLoading(false);
      return;
    }

    // Validate phone number
    if (!validatePhone(phone)) {
      setLoading(false);
      return;
    }

    try {
      // Prepare user data based on role
      const userData = {
        name,
        email,
        phone,
        password,
        confirmPassword,
        role,
        ...(role === "supplier" && { companyName, contactPerson }),
        ...(role === "employee" && { jobTitle, department }),
        ...(role === "customer" && { shippingAddress, billingAddress }),
      };

      // Send registration request to the backend
      const response = await axios.post("http://localhost:5000/api/auth/register", userData);

      if (response.data.success) {
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-700">Create an Account</h1>
          <p className="text-gray-600 mt-2">Join SpiceSense today</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Phone Number - With Validation */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+94 0712345678 or 0712345678"
              value={phone}
              onChange={handlePhoneChange}
              required
              className={`w-full px-3 py-2 border ${
                phoneError ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 ${
                phoneError ? 'focus:ring-red-500' : 'focus:ring-amber-500'
              }`}
            />
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordMatch(e.target.value === confirmPassword);
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              className={`w-full px-3 py-2 border ${
                passwordMatch ? 'border-gray-300' : 'border-red-500'
              } rounded-md focus:outline-none focus:ring-2 ${
                passwordMatch ? 'focus:ring-amber-500' : 'focus:ring-red-500'
              }`}
            />
            {!passwordMatch && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Role-Specific Fields */}
          {role === "supplier" && (
            <>
              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Your Company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                Warehouse Location
                </label>
                <input
                  id="contactPerson"
                  type="text"
                  placeholder="Warehouse Location"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          )}

          {role === "employee" && (
            <>
              <div className="space-y-2">
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  placeholder="Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  placeholder="Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          )}

          {role === "customer" && (
            <>
              <div className="space-y-2">
                <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
                  Shipping Address
                </label>
                <input
                  id="shippingAddress"
                  type="text"
                  placeholder="123 colombo 10"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                  Billing Address
                </label>
                <input
                  id="billingAddress"
                  type="text"
                  placeholder="Mathale ukuwela"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !passwordMatch || phoneError}
            className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors disabled:bg-amber-300"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-600 hover:text-amber-800 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;