import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../Styles/spice-otp-styles.css';

const VerifyEmail = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      setError("User ID not found. Please login again.");
    }
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementsByClassName('spice-otp-digit')[index + 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.join('').trim()) {
      setError("Please enter the OTP.");
      return;
    }
    if (!userId) {
      setError("User ID not found. Please login again.");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-account",
        { otp: otp.join(''), userId },
        { withCredentials: true }
      );
      if (response.data.success) {
        alert("Email verified successfully!");
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        navigate("/dashboard");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError(error.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spice-page-container">
      <div className="spice-form-card">
        <div className="spice-header">
          <h1 className="spice-title">Verify Your Email</h1>
          <p className="spice-subtitle">Enter the OTP sent to your email</p>
        </div>

        {error && <div className="spice-message spice-message-error">{error}</div>}

        <form onSubmit={handleSubmit} className="spice-form">
          <div className="spice-input-group">
            <label className="spice-label">OTP</label>
            <div className="spice-otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  required
                  className="spice-otp-digit"
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="spice-button">
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;