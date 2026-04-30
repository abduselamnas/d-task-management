import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiBriefcase,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Projects = () => {
  const { isAdmin, isManager, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium",
    status: "planning",
    start_date: "",
    end_date: "",
    team_id: "",
  });

  useEffect(() => {
    fetchProjects();
    if (isAdmin || isManager) fetchTeams();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      toast.error("Failed to fetch projects");
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
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData);
        toast.success("Project updated successfully");
      } else {
        await api.post("/projects", formData);
        toast.success("Project created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await api.delete(`/projects/${id}`);
        toast.success("Project deleted successfully");
        fetchProjects();
      } catch (error) {
        toast.error("Failed to delete project");
      }
    }
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      name: "",
      description: "",
      priority: "medium",
      status: "planning",
      start_date: "",
      end_date: "",
      team_id: "",
    });
  };
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };
  const editProject = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      priority: project.priority,
      status: project.status,
      start_date: project.start_date?.split("T")[0] || "",
      end_date: project.end_date?.split("T")[0] || "",
      team_id: project.team_id || "",
    });
    setShowModal(true);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all your projects
          </p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={openCreateModal} className="btn-primary">
            <FiPlus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                {project.name}
              </h3>
              {(isAdmin || (isManager && project.manager_id === user?.id)) && (
                <div className="flex gap-1">
                  <button
                    onClick={() => editProject(project)}
                    className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded-md"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {project.description || "No description"}
            </p>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{project.progress || 0}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`badge ${project.status === "active" ? "badge-success" : project.status === "completed" ? "badge-info" : "badge-warning"}`}
              >
                {project.status}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {project.total_tasks || 0} tasks
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProject ? "Edit Project" : "Create New Project"}
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
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="form-input"
                    rows="3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                </div>
                {(isAdmin || isManager) && (
                  <div>
                    <label className="form-label">Assign Team</label>
                    <select
                      value={formData.team_id}
                      onChange={(e) =>
                        setFormData({ ...formData, team_id: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="">Select Team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                  <FiSave size={14} />
                  <span>{editingProject ? "Update" : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
