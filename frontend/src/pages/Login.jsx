import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiMail,
  FiLock,
  FiLogIn,
  FiChevronDown,
  FiChevronUp,
  FiUsers,
} from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  const fillCredentials = (email, password) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-debo-primary to-debo-secondary py-12 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-debo-primary">
              Debo Task Manager
            </h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

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
                  placeholder="you@example.com"
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
                  placeholder="••••••"
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
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-debo-primary hover:text-debo-secondary font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Dropdown */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <FiUsers className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Demo Credentials
              </span>
            </div>
            {showDemo ? (
              <FiChevronUp className="text-gray-500" />
            ) : (
              <FiChevronDown className="text-gray-500" />
            )}
          </button>

          {showDemo && (
            <div className="px-6 pb-6 space-y-3 animate-fade-in">
              <p className="text-xs text-gray-500 text-center mb-2">
                Click any role to auto-fill credentials
              </p>

              {/* Admin Credential */}
              <button
                onClick={() => fillCredentials("admin@debo.com", "Admin@123")}
                className="w-full bg-blue-50 hover:bg-blue-100 transition-all rounded-lg p-3 text-left border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-800">Administrator</p>
                    <p className="text-xs text-blue-600 mt-1">admin@debo.com</p>
                  </div>
                  <div className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                    Full Access
                  </div>
                </div>
              </button>

              {/* Manager Credential */}
              <button
                onClick={() => fillCredentials("manager@debo.com", "Admin@123")}
                className="w-full bg-green-50 hover:bg-green-100 transition-all rounded-lg p-3 text-left border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-800">
                      Project Manager
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      manager@debo.com
                    </p>
                  </div>
                  <div className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    Manage Projects
                  </div>
                </div>
              </button>

              {/* Team Member Credential */}
              <button
                onClick={() => fillCredentials("team@debo.com", "Admin@123")}
                className="w-full bg-purple-50 hover:bg-purple-100 transition-all rounded-lg p-3 text-left border border-purple-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-purple-800">Team Member</p>
                    <p className="text-xs text-purple-600 mt-1">
                      team@debo.com
                    </p>
                  </div>
                  <div className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                    View Tasks
                  </div>
                </div>
              </button>

              <div className="mt-3 text-center">
                <p className="text-xs text-gray-400">
                  🔒 Password for all accounts:{" "}
                  <span className="font-mono font-semibold">Admin@123</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ⚡ Demo mode - Credentials are pre-filled for testing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
