import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiLogOut, FiBell, FiSettings } from "react-icons/fi";
import logo from "../assets/debo-logo.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className="shadow-md sticky top-0 z-50"
      style={{
        background:
          "linear-gradient(90deg, #0A192F 0%, #0B1F3A 50%, #132F4C 100%)",
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <img
              src={logo}
              alt="Debo Engineering"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
            <p className="text-xs text-amber-500 italic hidden sm:block">
              "In pursuit of Service"
            </p>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <button className="relative text-gray-300 hover:text-amber-500 transition-colors">
              <FiBell className="text-lg" />
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user?.full_name}
                </p>
                <p className="text-xs text-amber-500 capitalize">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>

              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.full_name?.charAt(0) || "U"}
                </span>
              </div>

              <Link
                to="/settings"
                className="text-gray-300 hover:text-amber-500 transition-colors"
              >
                <FiSettings className="text-lg" />
              </Link>

              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <FiLogOut className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
