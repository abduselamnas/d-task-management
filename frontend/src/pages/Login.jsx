import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form submitted with:", {
      email,
      password: password ? "***" : "",
    });

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password);
      console.log("Login result:", success);

      if (success) {
        console.log("Navigating to dashboard...");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    console.log("Filling admin credentials");
    setEmail("admin@debo.com");
    setPassword("Admin@123");
  };

  const fillManager = () => {
    console.log("Filling manager credentials");
    setEmail("manager@debo.com");
    setPassword("Admin@123");
  };

  const fillTeam = () => {
    console.log("Filling team credentials");
    setEmail("team@debo.com");
    setPassword("Admin@123");
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
              onClick={fillAdmin}
              className="w-full text-xs bg-blue-50 text-blue-700 py-1.5 rounded hover:bg-blue-100"
            >
              Admin: admin@debo.com
            </button>
            <button
              type="button"
              onClick={fillManager}
              className="w-full text-xs bg-green-50 text-green-700 py-1.5 rounded hover:bg-green-100"
            >
              Manager: manager@debo.com
            </button>
            <button
              type="button"
              onClick={fillTeam}
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
