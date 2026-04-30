import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUser,
  FiCalendar,
  FiX,
  FiSave,
  FiMessageSquare,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Tasks = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    project_id: "",
    assigned_to: "",
    search: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    priority: "medium",
    due_date: "",
    start_date: "",
    estimated_hours: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    if (isAdmin || isManager) fetchUsers();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const response = await api.get(`/tasks?${params}`);
      setTasks(response.data);
    } catch (error) {
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data.filter((u) => u.role === "team_member"));
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, formData);
        toast.success("Task updated successfully");
      } else {
        await api.post("/tasks", formData);
        toast.success("Task created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleStatusUpdate = async (taskId, status, progress) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, {
        status,
        progress_percentage: progress,
      });
      toast.success("Task status updated");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleProgressUpdate = async (taskId, progress) => {
    try {
      let status =
        progress === 100
          ? "completed"
          : progress === 0
            ? "pending"
            : "in_progress";
      await api.patch(`/tasks/${taskId}/status`, {
        progress_percentage: progress,
        status,
      });
      toast.success(`Progress updated to ${progress}%`);
      fetchTasks();
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this task?")) {
      try {
        await api.delete(`/tasks/${id}`);
        toast.success("Task deleted");
        fetchTasks();
      } catch (error) {
        toast.error("Failed to delete task");
      }
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      project_id: "",
      assigned_to: "",
      priority: "medium",
      due_date: "",
      start_date: "",
      estimated_hours: "",
    });
  };
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };
  const editTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      project_id: task.project_id,
      assigned_to: task.assigned_to || "",
      priority: task.priority,
      due_date: task.due_date?.split("T")[0] || "",
      start_date: task.start_date?.split("T")[0] || "",
      estimated_hours: task.estimated_hours || "",
    });
    setShowModal(true);
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    overdue: tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== "completed",
    ).length,
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
            Tasks
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track your tasks
          </p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={openCreateModal} className="btn-primary">
            <FiPlus size={16} />
            <span>New Task</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border-l-4 border-blue-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Tasks
          </p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            {taskStats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border-l-4 border-green-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-xl font-bold text-green-600">
            {taskStats.completed}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border-l-4 border-blue-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            In Progress
          </p>
          <p className="text-xl font-bold text-blue-600">
            {taskStats.inProgress}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border-l-4 border-yellow-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-xl font-bold text-yellow-600">
            {taskStats.pending}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border-l-4 border-red-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="text-xl font-bold text-red-600">{taskStats.overdue}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="form-input pl-8"
            />
          </div>
          <select
            value={filters.project_id}
            onChange={(e) =>
              setFilters({ ...filters, project_id: e.target.value })
            }
            className="form-input"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filters.assigned_to}
            onChange={(e) =>
              setFilters({ ...filters, assigned_to: e.target.value })
            }
            className="form-input"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="form-input"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
            className="form-input"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Progress</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {task.project_name}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {task.assignee_name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {task.assignee_name || "Unassigned"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusUpdate(
                        task.id,
                        e.target.value,
                        task.progress_percentage,
                      )
                    }
                    className="text-xs px-2 py-1 rounded-full border-0 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${task.priority === "high" ? "badge-danger" : task.priority === "medium" ? "badge-warning" : "badge-success"}`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${task.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {task.progress_percentage || 0}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md">
                      <FiMessageSquare size={14} />
                    </button>
                    {(isAdmin || isManager) && (
                      <>
                        <button
                          onClick={() => editTask(task)}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded-md"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-md"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-3">
                <div>
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
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
                    rows="2"
                  />
                </div>
                <div>
                  <label className="form-label">Project *</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) =>
                      setFormData({ ...formData, project_id: e.target.value })
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {(isAdmin || isManager) && (
                  <div>
                    <label className="form-label">Assign To</label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assigned_to: e.target.value,
                        })
                      }
                      className="form-input"
                    >
                      <option value="">Select Team Member</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_hours: e.target.value,
                      })
                    }
                    className="form-input"
                    placeholder="e.g., 4.5"
                  />
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
                  <FiSave size={14} />
                  <span>{editingTask ? "Update" : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
