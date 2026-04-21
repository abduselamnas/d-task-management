import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { FiLogOut, FiBell, FiUser } from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-md px-6 py-3">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-debo-primary">
            Debo Task Management
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="relative hover:bg-gray-100 p-2 rounded-full transition-colors">
            <FiBell className="text-gray-600 text-xl" />
            <span className="absolute -top-1 -right-1 bg-debo-danger text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          <div className="flex items-center space-x-3">
            {/* User Info */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 bg-debo-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <FiUser className="text-debo-primary" />
            </div>

            {/* Logout Button - Visible to ALL users */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut className="text-lg" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
