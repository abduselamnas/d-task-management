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
} from "react-icons/fi";
import toast from "react-hot-toast";

const Teams = () => {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    team_type: "backend",
  });

  useEffect(() => {
    fetchTeams();
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
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await api.delete(`/teams/${id}`);
        toast.success("Team deleted successfully");
        fetchTeams();
      } catch (error) {
        toast.error("Failed to delete team");
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

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-debo-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Teams</h1>
          <p className="text-gray-600 mt-1">Manage development teams</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg"
          >
            <FiPlus />
            <span>New Team</span>
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <FiUsers className="text-debo-primary text-2xl" />
                <h3 className="text-xl font-semibold text-gray-800">
                  {team.name}
                </h3>
              </div>
              {isAdmin && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => editTeam(team)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiEdit2 className="text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiTrash2 className="text-red-500" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-4">
              {team.description || "No description"}
            </p>
            <div className="text-sm text-gray-500">
              Members: {team.member_count || 0} | Projects:{" "}
              {team.project_count || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingTeam ? "Edit Team" : "Create New Team"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="input-label">Team Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">Team Type *</label>
                <select
                  value={formData.team_type}
                  onChange={(e) =>
                    setFormData({ ...formData, team_type: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="backend">Backend Development</option>
                  <option value="frontend_web">Frontend Web Development</option>
                  <option value="mobile">Mobile Development</option>
                  <option value="ui_ux">UI/UX Design</option>
                </select>
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field"
                  rows="3"
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
