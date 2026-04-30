import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  FiUser,
  FiLock,
  FiMoon,
  FiSun,
  FiSave,
  FiEye,
  FiEyeOff,
  FiBell,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    task_assigned: true,
    task_completed: true,
    project_updates: true,
  });

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`${newTheme === "dark" ? "Dark" : "Light"} mode enabled`);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, {
        full_name: profileData.full_name,
      });
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

  const handleNotificationChange = (key, value) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    toast.success(`${key.replace("_", " ")} updated`);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiLock },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "appearance", label: "Appearance", icon: FiMoon },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your account preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#0B1F3A] text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="p-5">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
                  Profile Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          full_name: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      className="form-input bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      value={user?.role?.replace("_", " ") || "Team Member"}
                      className="form-input bg-gray-50 dark:bg-gray-700 capitalize cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      <FiSave size={14} />
                      <span>{loading ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordChange} className="p-5">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
                  Change Password
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="form-label">Current Password</label>
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
                        className="form-input pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <FiEyeOff size={14} />
                        ) : (
                          <FiEye size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Password must be at least 6 characters
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirm_password: e.target.value,
                          })
                        }
                        className="form-input pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff size={14} />
                        ) : (
                          <FiEye size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      <FiSave size={14} />
                      <span>{loading ? "Updating..." : "Update Password"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="p-5">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
                  Notification Preferences
                </h2>

                <div className="space-y-2">
                  {[
                    {
                      key: "email_notifications",
                      label: "Email Notifications",
                      desc: "Receive email notifications",
                    },
                    {
                      key: "task_assigned",
                      label: "Task Assigned",
                      desc: "When a task is assigned to you",
                    },
                    {
                      key: "task_completed",
                      label: "Task Completed",
                      desc: "When your tasks are completed",
                    },
                    {
                      key: "project_updates",
                      label: "Project Updates",
                      desc: "When projects are updated",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key]}
                          onChange={(e) =>
                            handleNotificationChange(item.key, e.target.checked)
                          }
                          disabled={
                            item.key !== "email_notifications" &&
                            !notificationSettings.email_notifications
                          }
                          className="sr-only peer"
                        />
                        <div
                          className={`toggle-checkbox ${item.key !== "email_notifications" && !notificationSettings.email_notifications ? "opacity-50 cursor-not-allowed" : ""}`}
                        ></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Settings - Small compact buttons */}
            {activeTab === "appearance" && (
              <div className="p-5">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
                  Appearance
                </h2>

                <div>
                  <label className="form-label mb-2">Theme</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-all ${
                        theme === "light"
                          ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#0B1F3A]"
                      }`}
                    >
                      <FiSun size={12} />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-all ${
                        theme === "dark"
                          ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#0B1F3A]"
                      }`}
                    >
                      <FiMoon size={12} />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
