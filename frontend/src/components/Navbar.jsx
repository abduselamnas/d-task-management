import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiLogOut, FiBell, FiUser, FiSettings } from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
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
          <button className="relative">
            <FiBell className="text-gray-600 text-xl" />
            <span className="absolute -top-1 -right-1 bg-debo-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>

            <Link
              to="/settings"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Settings"
            >
              <FiSettings className="text-gray-600 text-xl" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Logout"
            >
              <FiLogOut className="text-gray-600 text-xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
