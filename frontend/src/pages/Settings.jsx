import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  FiUser,
  FiBell,
  FiLock,
  FiGlobe,
  FiMoon,
  FiSun,
  FiSave,
  FiShield,
  FiMail,
  FiSmartphone,
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    role: "",
  });

  // Password settings
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    task_assigned: true,
    task_completed: true,
    project_updates: true,
    daily_digest: false,
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: "light",
    compact_view: false,
    animations: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "",
      });
    }
    loadSettings();
  }, [user]);

  const loadSettings = () => {
    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem("theme");
    const savedNotifications = localStorage.getItem("notificationSettings");
    const savedAppearance = localStorage.getItem("appearance");

    if (savedTheme) {
      setAppearance((prev) => ({ ...prev, theme: savedTheme }));
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    }

    if (savedAppearance) {
      setAppearance(JSON.parse(savedAppearance));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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

  const handleNotificationChange = (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
    toast.success("Notification settings updated");
  };

  const handleAppearanceChange = (key, value) => {
    const newAppearance = { ...appearance, [key]: value };
    setAppearance(newAppearance);
    localStorage.setItem("appearance", JSON.stringify(newAppearance));

    if (key === "theme") {
      document.documentElement.classList.toggle("dark", value === "dark");
      localStorage.setItem("theme", value);
    }

    toast.success("Appearance settings updated");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiLock },
    { id: "notifications", label: "Notifications", icon: FiBell },
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
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        full_name: e.target.value,
                      })
                    }
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    className="input-field pl-10 bg-gray-100"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact admin for assistance.
                </p>
              </div>

              <div>
                <label className="input-label">Role</label>
                <div className="relative">
                  <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.role?.replace("_", " ")}
                    className="input-field pl-10 bg-gray-100 capitalize"
                    disabled
                  />
                </div>
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
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                    className="input-field pl-10"
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
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        new_password: e.target.value,
                      })
                    }
                    className="input-field pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="input-label">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    className="input-field pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
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

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Notification Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-500">
                      Receive email notifications about your activity
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_notifications}
                      onChange={(e) =>
                        handleNotificationChange(
                          "email_notifications",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-debo-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-debo-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Task Assigned</p>
                    <p className="text-sm text-gray-500">
                      Get notified when a task is assigned to you
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.task_assigned}
                      onChange={(e) =>
                        handleNotificationChange(
                          "task_assigned",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                      disabled={!notificationSettings.email_notifications}
                    />
                    <div
                      className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-debo-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-debo-primary ${!notificationSettings.email_notifications ? "opacity-50" : ""}`}
                    ></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Task Completed</p>
                    <p className="text-sm text-gray-500">
                      Get notified when your tasks are completed
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.task_completed}
                      onChange={(e) =>
                        handleNotificationChange(
                          "task_completed",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                      disabled={!notificationSettings.email_notifications}
                    />
                    <div
                      className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-debo-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-debo-primary ${!notificationSettings.email_notifications ? "opacity-50" : ""}`}
                    ></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Project Updates</p>
                    <p className="text-sm text-gray-500">
                      Get notified about project changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.project_updates}
                      onChange={(e) =>
                        handleNotificationChange(
                          "project_updates",
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                      disabled={!notificationSettings.email_notifications}
                    />
                    <div
                      className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-debo-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-debo-primary ${!notificationSettings.email_notifications ? "opacity-50" : ""}`}
                    ></div>
                  </label>
                </div>
              </div>
            </div>
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
                      onClick={() => handleAppearanceChange("theme", "light")}
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
                      onClick={() => handleAppearanceChange("theme", "dark")}
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

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Compact View</p>
                    <p className="text-sm text-gray-500">
                      Show more content by reducing spacing
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearance.compact_view}
                      onChange={(e) =>
                        handleAppearanceChange("compact_view", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-debo-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-debo-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Animations</p>
                    <p className="text-sm text-gray-500">
                      Enable smooth animations throughout the app
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearance.animations}
                      onChange={(e) =>
                        handleAppearanceChange("animations", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-debo-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-debo-primary"></div>
                  </label>
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
