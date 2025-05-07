import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import '../Styles/auth.css';


const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      setPasswordError("Password is required");
      return false;
    } else if (passwordValue.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    if (confirmPassword) {
      setPasswordMatch(value === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(password === value);
  };

  const validatePhone = (phoneNumber) => {
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

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    validatePhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validatePassword(password)) {
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPasswordMatch(false);
      setLoading(false);
      return;
    }

    if (!validatePhone(phone)) {
      setLoading(false);
      return;
    }

    try {
      const userData = {
        name, email, phone, password, confirmPassword, role,
        ...(role === "supplier" && { companyName, contactPerson }),
        ...(role === "employee" && { jobTitle, department }),
        ...(role === "customer" && { shippingAddress, billingAddress }),
      };

      const response = await axios.post("http://localhost:5000/api/auth/register", userData);

      if (response.data.success) {
        alert("Registration successful! Please verify your email.");
        sessionStorage.setItem("userId", response.data.userId);
        navigate("/verify-account");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="spicesense-page">
    {/* Header */}
    <header className="spicesense-header">
      <div className="spicesense-logo">
        <span>SpiceSense</span>
      </div>
    </header>

    <div className="auth-page">
      <div className="auth-container">
        <div className="text-center">
          <h1>Create an Account</h1>
          <p>Join SpiceSense today</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="name" className="auth-label">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email" className="auth-label">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="phone" className="auth-label">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="+94 0712345678 or 0712345678"
              value={phone}
              onChange={handlePhoneChange}
              required
              className={`auth-input ${phoneError ? 'auth-error' : ''}`}
            />
            {phoneError && <p className="auth-error-text">{phoneError}</p>}
          </div>

          <div className="auth-form-group">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              required
              className={`auth-input ${passwordError ? 'auth-error' : ''}`}
            />
            {passwordError && <p className="auth-error-text">{passwordError}</p>}
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              className={`auth-input ${!passwordMatch ? 'auth-error' : ''}`}
            />
            {!passwordMatch && <p className="auth-error-text">Passwords do not match</p>}
          </div>

          <div className="auth-form-group">
            <label htmlFor="role" className="auth-label">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-select"
            >
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          {role === "supplier" && (
            <>
              <div className="auth-form-group">
                <label htmlFor="companyName" className="auth-label">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Your Company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-form-group">
                <label htmlFor="contactPerson" className="auth-label">Warehouse Location</label>
                <input
                  id="contactPerson"
                  type="text"
                  placeholder="Warehouse Location"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
            </>
          )}

          {role === "customer" && (
            <>
              <div className="auth-form-group">
                <label htmlFor="shippingAddress" className="auth-label">Shipping Address</label>
                <input
                  id="shippingAddress"
                  type="text"
                  placeholder="123 Colombo 10"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-form-group">
                <label htmlFor="billingAddress" className="auth-label">Billing Address</label>
                <input
                  id="billingAddress"
                  type="text"
                  placeholder="Matale Ukuwela"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || !passwordMatch || phoneError || passwordError}
            className="auth-button"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Register;