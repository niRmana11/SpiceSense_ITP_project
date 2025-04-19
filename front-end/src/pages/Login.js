import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import '../Styles/auth.css'; // Import the CSS

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiResponse, setApiResponse] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setApiResponse(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

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
      setError(
        error.response?.data?.message ||
        `Server error: ${error.response?.status}` ||
        "No response from server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="text-center">
          <h1>Log In</h1>
          <p>Welcome back to SpiceSense</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {apiResponse && (
          <div className="auth-error" style={{ background: '#dbeafe', borderColor: '#60a5fa', color: '#1e3a8a' }}>
            <p>Debug Response:</p>
            <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/send-reset-otp" className="auth-link">
            Forgot your password?
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;