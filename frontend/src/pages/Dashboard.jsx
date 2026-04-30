import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Dashboard mounted - isAuthenticated:", isAuthenticated);
    console.log("Dashboard mounted - user:", user);

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      console.log("Fetching dashboard data...");
      console.log("Token exists:", !!localStorage.getItem("token"));

      // Try to fetch data with proper error handling
      const tasksRes = await api.get("/tasks").catch((err) => {
        console.error("Tasks fetch failed:", err);
        return { data: [] };
      });

      const projectsRes = await api.get("/projects").catch((err) => {
        console.error("Projects fetch failed:", err);
        return { data: [] };
      });

      const tasks = tasksRes.data || [];
      const completedTasks = tasks.filter(
        (t) => t.status === "completed",
      ).length;

      setStats({
        totalProjects: (projectsRes.data || []).length,
        totalTasks: tasks.length,
        completedTasks: completedTasks,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-debo-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.full_name || "User"}!
        </p>
        <p className="text-gray-600">
          Role: <strong>{user?.role || "Unknown"}</strong>
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Projects</h2>
          <p className="text-3xl font-bold text-debo-primary">
            {stats.totalProjects}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Total Tasks
          </h2>
          <p className="text-3xl font-bold text-debo-primary">
            {stats.totalTasks}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Completed Tasks
          </h2>
          <p className="text-3xl font-bold text-green-600">
            {stats.completedTasks}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
