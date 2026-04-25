import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      console.log("Sending login request...");
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);

      if (response.data.success && response.data.token) {
        // Save to localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        toast.success("Login successful!");
        console.log("Redirecting to dashboard...");

        // Force navigation
        window.location.href = "/dashboard";
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email, password) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-debo-primary to-debo-secondary">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-debo-primary">
            Debo Task Manager
          </h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="input-label">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="admin@debo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="Admin@123"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FiLogIn />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="text-debo-primary hover:text-debo-secondary"
          >
            Don't have an account? Sign up
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">
            Demo Credentials:
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillCredentials("admin@debo.com", "Admin@123")}
              className="w-full text-xs bg-blue-50 text-blue-700 py-1.5 rounded hover:bg-blue-100"
            >
              Admin: admin@debo.com
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("manager@debo.com", "Admin@123")}
              className="w-full text-xs bg-green-50 text-green-700 py-1.5 rounded hover:bg-green-100"
            >
              Manager: manager@debo.com
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("team@debo.com", "Admin@123")}
              className="w-full text-xs bg-purple-50 text-purple-700 py-1.5 rounded hover:bg-purple-100"
            >
              Team Member: team@debo.com
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Password for all: Admin@123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
