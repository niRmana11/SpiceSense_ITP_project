import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../Styles/spice-otp-styles.css';

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
      const response = await axios.post('http://localhost:5000/api/auth/send-reset-otp', { email });
      if (response.data.success) {
        setMessageType('success');
        setMessage(response.data.message);
        setOtpSent(true);
        localStorage.setItem('resetEmail', email); // Store email in localStorage
        console.log('OTP sent, passing email:', email);
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
    <div className="spice-page-container">
      <div className="spice-form-card">
        <div className="spice-header">
          <h1 className="spice-title">Reset Password</h1>
          <p className="spice-subtitle">Enter your email to receive a reset OTP</p>
        </div>

        {message && (
          <div className={`spice-message ${messageType === 'success' ? 'spice-message-success' : 'spice-message-error'}`}>
            {message}
          </div>
        )}

        {!otpSent ? (
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
            <button type="submit" disabled={isSubmitting} className="spice-button">
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <div className="spice-form">
            <p className="spice-subtitle text-center">OTP has been sent to your email. Please check your inbox.</p>
            <Link
              to={{
                pathname: '/reset-password',
                state: { email } // Pass email through state
              }}
              className="spice-button"
            >
              Enter OTP to Reset Password
            </Link>
          </div>
        )}

        <div className="spice-link-section">
          <p className="spice-link-text">
            Remember your password?{' '}
            <Link to="/login" className="spice-link">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendResetOtp;