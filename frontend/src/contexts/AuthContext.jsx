import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    console.log("AuthProvider init - token:", token ? "exists" : "none");
    console.log("AuthProvider init - userData:", userData);

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log("User loaded:", parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Login attempt:", email);
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast.success(`Welcome back, ${user.full_name}!`);
      return true;
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    console.log("Logging out user:", user?.email);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
  };

  // Role check helpers
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "project_manager" || user?.role === "admin";
  const isTeamMember = user?.role === "team_member";

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    isManager,
    isTeamMember,
  };

  console.log("AuthContext value:", {
    isAuthenticated: !!user,
    role: user?.role,
    isAdmin,
    isManager,
    isTeamMember,
  });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
