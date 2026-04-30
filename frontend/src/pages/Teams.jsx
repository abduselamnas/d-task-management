import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiUsers,
  FiUserPlus,
  FiUserMinus,
  FiMail,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Teams = () => {
  const { isAdmin, isManager, user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    team_type: "backend",
  });

  useEffect(() => {
    fetchTeams();
    if (isAdmin) {
      fetchUsers();
    }
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get("/teams");
      setTeams(response.data);
    } catch (error) {
      toast.error("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      setTeamMembers(response.data);
    } catch (error) {
      toast.error("Failed to fetch team members");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, formData);
        toast.success("Team updated successfully");
      } else {
        await api.post("/teams", formData);
        toast.success("Team created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this team? This will remove all associations.",
      )
    ) {
      try {
        await api.delete(`/teams/${id}`);
        toast.success("Team deleted successfully");
        fetchTeams();
      } catch (error) {
        toast.error("Failed to delete team");
      }
    }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/teams/${selectedTeam.id}/members`, { user_id: userId });
      toast.success("Member added successfully");
      fetchTeamMembers(selectedTeam.id);
      fetchTeams();
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const removeMember = async (userId) => {
    if (window.confirm("Remove this member from the team?")) {
      try {
        await api.delete(`/teams/${selectedTeam.id}/members/${userId}`);
        toast.success("Member removed successfully");
        fetchTeamMembers(selectedTeam.id);
        fetchTeams();
      } catch (error) {
        toast.error("Failed to remove member");
      }
    }
  };

  const resetForm = () => {
    setEditingTeam(null);
    setFormData({
      name: "",
      description: "",
      team_type: "backend",
    });
  };

  const editTeam = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      team_type: team.team_type,
    });
    setShowModal(true);
  };

  const viewTeamDetails = async (team) => {
    setSelectedTeam(team);
    await fetchTeamMembers(team.id);
    setShowMemberModal(true);
  };

  const getTeamTypeIcon = (type) => {
    const icons = {
      backend: "🔧",
      frontend_web: "🎨",
      mobile: "📱",
      ui_ux: "🎯",
    };
    return icons[type] || "👥";
  };

  const getTeamTypeLabel = (type) => {
    const labels = {
      backend: "Backend Development",
      frontend_web: "Frontend Web",
      mobile: "Mobile App",
      ui_ux: "UI/UX Design",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-debo-primary"></div>
      </div>
    );
  }

  // Only admin and managers can view this page
  if (!isAdmin && !isManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiUsers className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700">
            Access Denied
          </h2>
          <p className="text-gray-500 mt-2">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Teams
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage development teams and members
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus />
            <span>New Team</span>
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">
                    {getTeamTypeIcon(team.team_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getTeamTypeLabel(team.team_type)}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editTeam(team)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <FiEdit2 className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <FiTrash2 className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {team.description || "No description provided"}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FiUsers className="mr-2" />
                    <span>{team.member_count || 0} Members</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FiPlus className="mr-2" />
                    <span>{team.project_count || 0} Projects</span>
                  </div>
                </div>

                <button
                  onClick={() => viewTeamDetails(team)}
                  className="w-full btn-secondary text-sm py-2"
                >
                  Manage Members
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No teams found. Create your first team!
          </p>
        </div>
      )}

      {/* Team Members Modal */}
      {showMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {selectedTeam.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Team Members
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedTeam(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Add Member Section */}
              {isAdmin && (
                <div className="mb-6">
                  <label className="input-label dark:text-gray-300">
                    Add New Member
                  </label>
                  <div className="flex space-x-2">
                    <select
                      id="newMember"
                      className="input-field flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select a user
                      </option>
                      {users
                        .filter(
                          (user) => !teamMembers.some((m) => m.id === user.id),
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} - {user.role?.replace("_", " ")}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById("newMember");
                        const userId = select.value;
                        if (userId) {
                          addMember(userId);
                          select.value = "";
                        } else {
                          toast.error("Please select a user");
                        }
                      }}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <FiUserPlus />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Current Members ({teamMembers.length})
                </h3>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-debo-primary bg-opacity-10 rounded-full flex items-center justify-center">
                        <span className="text-debo-primary dark:text-debo-secondary font-semibold">
                          {member.full_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {member.full_name}
                        </p>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 capitalize">
                            {member.role?.replace("_", " ")}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">
                            •
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                        title="Remove"
                      >
                        <FiUserMinus size={18} />
                      </button>
                    )}
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No members in this team yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingTeam ? "Edit Team" : "Create New Team"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="input-label dark:text-gray-300">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="input-label dark:text-gray-300">
                  Team Type *
                </label>
                <select
                  value={formData.team_type}
                  onChange={(e) =>
                    setFormData({ ...formData, team_type: e.target.value })
                  }
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                >
                  <option value="backend">Backend Development Team</option>
                  <option value="frontend_web">
                    Frontend Web Development Team
                  </option>
                  <option value="mobile">
                    Mobile Application Development Team
                  </option>
                  <option value="ui_ux">UI/UX Design Team</option>
                </select>
              </div>

              <div>
                <label className="input-label dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  rows="3"
                  placeholder="Describe the team's responsibilities..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <FiSave />
                  <span>{editingTeam ? "Update" : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
