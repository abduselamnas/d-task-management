import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBriefcase,
  FiCheckSquare,
  FiUsers,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const { isAdmin, isManager, user } = useAuth();

  console.log("Sidebar rendering - User role:", user?.role);
  console.log("Sidebar rendering - isAdmin:", isAdmin);
  console.log("Sidebar rendering - isManager:", isManager);

  const menuItems = [
    { path: "/dashboard", icon: FiHome, label: "Dashboard", show: true },
    { path: "/projects", icon: FiBriefcase, label: "Projects", show: true },
    { path: "/tasks", icon: FiCheckSquare, label: "Tasks", show: true },
    {
      path: "/teams",
      icon: FiUsers,
      label: "Teams",
      show: isAdmin || isManager,
    },
    {
      path: "/reports",
      icon: FiBarChart2,
      label: "Reports",
      show: isAdmin || isManager,
    },
  ];

  return (
    <aside className="w-64 bg-debo-primary text-white flex flex-col shadow-lg">
      {/* Logo Section */}
      <div className="p-6 border-b border-debo-secondary border-opacity-30">
        <h1 className="text-2xl font-bold">Debo</h1>
        <p className="text-sm opacity-80 mt-1">Task Manager</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => {
          if (!item.show) return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-6 py-3 transition-colors ${
                  isActive
                    ? "bg-debo-secondary text-white border-l-4 border-white"
                    : "hover:bg-debo-secondary hover:bg-opacity-50"
                }`
              }
            >
              <item.icon className="text-xl" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-debo-secondary border-opacity-30">
        <div className="flex items-center space-x-3">
          <FiSettings className="text-xl" />
          <span>Settings</span>
        </div>
        <div className="text-xs opacity-60 mt-4 text-center">
          © 2026 Debo Engineering
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
