import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiMail,
  FiLock,
  FiUser,
  FiUserPlus,
  FiArrowLeft,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "team_member",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("Sending registration request...");
      const response = await api.post("/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      console.log("Registration response:", response.data);

      if (response.data.success && response.data.token) {
        // Save token and user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        toast.success("Registration successful! Welcome aboard!");

        // Navigate to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        toast.error(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-debo-primary to-debo-secondary py-12 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-600 mt-2">Join Debo Task Manager</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="•••••• (min. 6 characters)"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="team_member">👥 Team Member</option>
                <option value="project_manager">📊 Project Manager</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Note: Admin role requires approval.
              </p>
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
                  <FiUserPlus />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 rounded-b-lg p-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="inline-flex items-center space-x-1 text-debo-primary hover:text-debo-secondary font-semibold"
              >
                <span>Sign in here</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
