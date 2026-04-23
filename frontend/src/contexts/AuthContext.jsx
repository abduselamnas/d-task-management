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

    console.log("Loading stored data - token:", token ? "exists" : "none");
    console.log("Loading stored data - userData:", userData);

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        api.defaults.headers.common["x-auth-token"] = token;
        console.log("User loaded from storage:", parsedUser.email);
      } catch (error) {
        console.error("Error parsing user data:", error);
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
      console.log("Login response status:", response.status);
      console.log("Login response data:", response.data);

      const { token, user } = response.data;

      if (!token || !user) {
        console.error("Invalid response - missing token or user");
        toast.error("Invalid server response");
        return false;
      }

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set token in axios defaults
      api.defaults.headers.common["x-auth-token"] = token;

      setUser(user);
      console.log("Login successful! User:", user.email);
      console.log("Token saved to localStorage");
      toast.success(`Welcome back, ${user.full_name}!`);
      return true;
    } catch (error) {
      console.error("Login error details:", error);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    console.log("Logging out");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["x-auth-token"];
    setUser(null);
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isManager: user?.role === "project_manager" || user?.role === "admin",
    isTeamMember: user?.role === "team_member",
  };

  console.log("AuthContext state:", {
    isAuthenticated: !!user,
    role: user?.role,
    loading,
  });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
