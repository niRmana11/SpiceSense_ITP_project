import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Get userId from session storage
    const storedUserId = sessionStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      setError("User ID not found. Please login again.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
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
      // Pass userId explicitly in the request
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-account",
        { otp, userId },
        { withCredentials: true }
      );

      console.log("Verification response:", response.data);

      if (response.data.success) {
        alert("Email verified successfully!");
        // Store the token in localStorage as a backup
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        navigate("/dashboard");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      let errorMessage = "An error occurred. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-700">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">Enter the OTP sent to your email</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              OTP
            </label>
            <input
              id="otp"
              type="text"
              placeholder="Enter your OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;