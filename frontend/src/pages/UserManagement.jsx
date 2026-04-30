import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiUser,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "team_member",
    team_id: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log("Fetching users...");
      const response = await api.get("/users");
      console.log("Users fetched:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get("/teams");
      setTeams(response.data);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          full_name: formData.full_name,
          role: formData.role,
          team_id: formData.team_id,
        });
        toast.success("User updated successfully");
      } else {
        await api.post("/users", {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          team_id: formData.team_id,
        });
        toast.success("User created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      try {
        await api.delete(`/users/${user.id}`);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      full_name: "",
      email: "",
      password: "",
      role: "team_member",
      team_id: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const editUser = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
      team_id: user.team_id || "",
    });
    setShowModal(true);
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
      toast.success(
        `${user.full_name} ${!user.is_active ? "activated" : "deactivated"}`,
      );
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "project_manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <FiShield className="mr-1" size={12} />;
      default:
        return <FiUser className="mr-1" size={12} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <FiPlus size={14} className="mr-2" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Team</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {user.full_name?.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.full_name}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}
                  >
                    {getRoleIcon(user.role)}
                    {user.role?.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {user.team_name || "Unassigned"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleUserStatus(user)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                      user.is_active !== false
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {user.is_active !== false ? (
                      <FiCheckCircle size={12} />
                    ) : (
                      <FiAlertCircle size={12} />
                    )}
                    {user.is_active !== false ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => editUser(user)}
                      className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? "Edit User" : "Add New User"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>

                {!editingUser && (
                  <>
                    <div>
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="form-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="form-input"
                        placeholder="Min 6 characters"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="form-label">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="form-select"
                  >
                    <option value="team_member">Team Member</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Assign Team</label>
                  <select
                    value={formData.team_id}
                    onChange={(e) =>
                      setFormData({ ...formData, team_id: e.target.value })
                    }
                    className="form-select"
                  >
                    <option value="">No Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FiSave size={14} className="mr-2" />
                  <span>{editingUser ? "Update" : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
