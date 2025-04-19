import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Styles/spice-otp-styles.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(newPassword === value);
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordMatch(value === confirmPassword);
  };

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
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setPasswordMatch(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        otp: otp.join(''),
        newPassword,
      });
      if (response.data.success) {
        alert('Password reset successfully!');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error resetting password:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spice-page-container">
      <div className="spice-form-card">
        <div className="spice-header">
          <h1 className="spice-title">Reset Password</h1>
          <p className="spice-subtitle">Enter your information to reset your password</p>
        </div>
        
        {error && <div className="spice-message spice-message-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="spice-form">
          <div className="spice-input-group">
            <label htmlFor="email" className="spice-label">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="spice-input"
            />
          </div>
          
          <div className="spice-input-group">
            <label className="spice-label">OTP Code</label>
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
          
          <div className="spice-input-group">
            <label htmlFor="newPassword" className="spice-label">New Password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={handleNewPasswordChange}
              required
              className="spice-input"
            />
          </div>
          
          <div className="spice-input-group">
            <label htmlFor="confirmPassword" className="spice-label">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              className={`spice-input ${!passwordMatch ? 'spice-input-error' : ''}`}
            />
            {!passwordMatch && <p className="spice-error-text">Passwords do not match</p>}
          </div>
          
          <button type="submit" disabled={loading || !passwordMatch} className="spice-button">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;