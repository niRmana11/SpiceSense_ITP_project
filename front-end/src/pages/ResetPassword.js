import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check password match when confirm password changes
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(newPassword === value);
  };

  // Also check match when new password changes
  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordMatch(value === confirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password match before submitting
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
        otp,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-700">Reset Password</h1>
          <p className="text-gray-600 mt-2">Enter your information to reset your password</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
          
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              OTP Code
            </label>
            <input
              id="otp"
              type="text"
              placeholder="Enter OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={handleNewPasswordChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
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
          
          <button
            type="submit"
            disabled={loading || !passwordMatch}
            className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors disabled:bg-amber-300"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;