import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiResponse, setApiResponse] = useState(null); // Debugging
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setApiResponse(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", { email });

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      console.log("Login response:", response.data);
      setApiResponse(response.data);

      if (response.data.success) {
        sessionStorage.setItem("userId", response.data.userId);
        if (response.data.role) {
          sessionStorage.setItem("userRole", response.data.role);
        }

        alert("Login successful! Please verify your email.");
        navigate("/verify-account");
      } else {
        setError(response.data.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        console.error("Error response:", error.response.data);
        setError(error.response.data.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        setError("No response from server. Please check your connection.");
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-700">Log In</h1>
          <p className="text-gray-600 mt-2">Welcome back to SpiceSense</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {apiResponse && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4 text-xs">
            <p>Debug Response:</p>
            <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
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

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors disabled:bg-amber-300"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        
<div className="mt-4 text-center">
  <Link to="/send-reset-otp" className="text-amber-600 hover:text-amber-800 font-medium">
    Forgot your password?
  </Link>
</div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-amber-600 hover:text-amber-800 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
