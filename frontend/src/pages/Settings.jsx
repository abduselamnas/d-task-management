import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  FiUser,
  FiBell,
  FiLock,
  FiMoon,
  FiSun,
  FiSave,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  // Password settings
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem("theme") || "light",
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update user profile
      await api.put(`/users/${user.id}`, {
        full_name: profileData.full_name,
      });
      // Update local user data
      const updatedUser = { ...user, full_name: profileData.full_name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success("Password changed successfully");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceChange = (theme) => {
    setAppearance({ theme });
    localStorage.setItem("theme", theme);
    toast.success(`${theme} mode enabled`);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiLock },
    { id: "appearance", label: "Appearance", icon: FiMoon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64 bg-white rounded-lg shadow-md overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                activeTab === tab.id
                  ? "bg-debo-primary text-white"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Profile Information
              </h2>

              <div>
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      full_name: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  className="input-field bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="input-label">Role</label>
                <input
                  type="text"
                  value={user?.role?.replace("_", " ")}
                  className="input-field bg-gray-100 capitalize"
                  disabled
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <FiSave />
                <span>{loading ? "Saving..." : "Save Changes"}</span>
              </button>
            </form>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Change Password
              </h2>

              <div>
                <label className="input-label">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                    className="input-field"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="input-label">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="input-label">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <FiSave />
                <span>{loading ? "Updating..." : "Update Password"}</span>
              </button>
            </form>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Appearance
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Theme</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => handleAppearanceChange("light")}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                        appearance.theme === "light"
                          ? "border-debo-primary bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <FiSun size={20} />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppearanceChange("dark")}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                        appearance.theme === "dark"
                          ? "border-debo-primary bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <FiMoon size={20} />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
