import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SendResetOtp = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-reset-otp', {
        email
      });

      if (response.data.success) {
        setMessageType('success');
        setMessage(response.data.message);
        setOtpSent(true);
      } else {
        setMessageType('error');
        setMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-700">Reset Password</h1>
          <p className="text-gray-600 mt-2">Enter your email to receive a reset OTP</p>
        </div>

        {message && (
          <div 
            className={`${
              messageType === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
            } px-4 py-3 rounded relative mb-4 border`}
          >
            {message}
          </div>
        )}

        {!otpSent ? (
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors disabled:bg-amber-300"
            >
              {isSubmitting ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <p className="text-center text-gray-700">
              OTP has been sent to your email. Please check your inbox.
            </p>
            <Link 
              to="/reset-password" 
              className="block w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors text-center"
            >
              Enter OTP to Reset Password
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-amber-600 hover:text-amber-800 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendResetOtp;