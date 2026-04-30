import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBriefcase,
  FiCheckSquare,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiUserPlus,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/debo-logo.png";

const Sidebar = () => {
  const { isAdmin, isManager } = useAuth();

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
    { path: "/users", icon: FiUserPlus, label: "Users", show: isAdmin },
    {
      path: "/reports",
      icon: FiBarChart2,
      label: "Reports",
      show: isAdmin || isManager,
    },
    { path: "/settings", icon: FiSettings, label: "Settings", show: true },
  ];

  return (
    <aside
      className="w-64 flex flex-col h-screen sticky top-0"
      style={{
        background:
          "linear-gradient(135deg, #0A192F 0%, #0B1F3A 50%, #132F4C 100%)",
      }}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-white border-opacity-10">
        <div className="flex items-center space-x-2">
          <img
            src={logo}
            alt="Debo Engineering"
            className="h-8 w-auto object-contain brightness-0 invert"
          />
        </div>
        <p className="text-xs text-amber-500 italic mt-2">
          "In pursuit of Service"
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4">
        {menuItems.map((item) => {
          if (!item.show) return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2 mx-2 rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-white bg-opacity-10 text-amber-500 font-medium"
                    : "text-gray-300 hover:bg-white hover:bg-opacity-5 hover:text-amber-400"
                }`
              }
            >
              <item.icon className="text-lg" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white border-opacity-10 mt-auto">
        <p className="text-xs text-gray-400 text-center">
          © 2026 Debo Engineering
        </p>
        <p className="text-xs text-amber-500 text-center mt-1">
          In pursuit of Service
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
