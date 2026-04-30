import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import toast from "react-hot-toast";
import logo from "../assets/debo-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email, password) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A192F] via-[#0B1F3A] to-[#132F4C]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <img
            src={logo}
            alt="Debo Engineering"
            className="h-12 w-auto mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sign in to your account
          </p>
          <p className="text-xs text-amber-500 italic mt-1">
            "In pursuit of Service"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <FiMail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={16}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input pl-9"
                placeholder="admin@debo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <FiLock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={16}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-9"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2"
          >
            {loading ? (
              <div className="spinner mx-auto"></div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="text-sm text-[#0B1F3A] dark:text-amber-500 hover:underline"
          >
            Don't have an account? Sign up
          </Link>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
            Demo Credentials:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("admin@debo.com", "Admin@123")}
              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-1.5 rounded-lg hover:bg-blue-100"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("manager@debo.com", "Admin@123")}
              className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-1.5 rounded-lg hover:bg-green-100"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("team@debo.com", "Admin@123")}
              className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 py-1.5 rounded-lg hover:bg-purple-100"
            >
              Team
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            Password for all: Admin@123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
