import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiBarChart2,
  FiDownload,
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

const Reports = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [projectSummary, setProjectSummary] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [userProductivity, setUserProductivity] = useState(null);
  const [taskSummary, setTaskSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [projectRes, teamRes, userRes, taskRes] = await Promise.all([
        api.get("/reports/project-summary"),
        api.get("/reports/team-performance"),
        api.get("/reports/user-productivity"),
        api.get(
          `/reports/task-summary?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`,
        ),
      ]);

      setProjectSummary(projectRes.data);
      setTeamPerformance(teamRes.data);
      setUserProductivity(userRes.data);
      setTaskSummary(taskRes.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    try {
      // Create comprehensive CSV report
      const headers = [
        "Report Type",
        "Project Name",
        "Status",
        "Total Tasks",
        "Completed Tasks",
        "Overdue Tasks",
        "Progress %",
        "Manager",
        "Team",
      ];

      const rows = [];

      // Add project data
      projectSummary.forEach((project) => {
        rows.push([
          "Project Summary",
          project.project_name || "",
          project.status || "",
          project.total_tasks || 0,
          project.completed_tasks || 0,
          project.overdue_tasks || 0,
          project.progress_percentage || 0,
          project.manager_name || "N/A",
          project.team_name || "N/A",
        ]);
      });

      // Add team performance data if exists
      if (teamPerformance.length > 0) {
        rows.push(["", "", "", "", "", "", "", "", ""]);
        rows.push(["TEAM PERFORMANCE", "", "", "", "", "", "", "", ""]);
        teamPerformance.forEach((team) => {
          rows.push([
            "Team Summary",
            team.team_name || "",
            team.team_type || "",
            team.total_tasks || 0,
            team.completed_tasks || 0,
            team.overdue_tasks || 0,
            team.completion_rate || 0,
            team.member_count || 0,
            team.project_count || 0,
          ]);
        });
      }

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `debo_report_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Report exported successfully with ${rows.length} records`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  const COLORS = [
    "#1E3A8A",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-debo-primary"></div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalProjects = projectSummary.length;
  const totalTasks = projectSummary.reduce(
    (sum, p) => sum + (p.total_tasks || 0),
    0,
  );
  const completedTasks = projectSummary.reduce(
    (sum, p) => sum + (p.completed_tasks || 0),
    0,
  );
  const overdueTasks = projectSummary.reduce(
    (sum, p) => sum + (p.overdue_tasks || 0),
    0,
  );
  const avgProgress =
    projectSummary.length > 0
      ? (
          projectSummary.reduce(
            (sum, p) => sum + (p.progress_percentage || 0),
            0,
          ) / projectSummary.length
        ).toFixed(1)
      : 0;

  // Prepare chart data
  const projectStatusData = projectSummary.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(projectStatusData).map(
    ([name, value]) => ({ name, value }),
  );

  const taskStatusData = taskSummary.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + t.task_count;
    return acc;
  }, {});

  const taskStatusChartData = Object.entries(taskStatusData).map(
    ([name, value]) => ({ name, value }),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            View project performance and team analytics
          </p>
        </div>
        {(isAdmin || isManager) && (
          <button
            onClick={exportReport}
            className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all"
          >
            <FiDownload />
            <span>Export Report</span>
          </button>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-4">
          <FiCalendar className="text-gray-400" />
          <div className="flex space-x-4">
            <div>
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start_date: e.target.value })
                }
                className="input-field ml-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end_date: e.target.value })
                }
                className="input-field ml-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={<FiBriefcase size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={<FiCheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={<FiCheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Overdue Tasks"
          value={overdueTasks}
          icon={<FiAlertCircle size={24} />}
          color="red"
        />
        <StatCard
          title="Avg Progress"
          value={`${avgProgress}%`}
          icon={<FiTrendingUp size={24} />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Project Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Task Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskStatusChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Summary Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Project Performance Summary
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projectSummary.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {project.project_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Manager: {project.manager_name || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.status === "active"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {project.total_tasks || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    {project.completed_tasks || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {project.overdue_tasks || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-debo-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${project.progress_percentage || 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {project.progress_percentage || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {projectSummary.length === 0 && (
                <tr key="no-data">
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No project data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Team Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamPerformance.map((team) => (
                <tr key={team.team_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {team.team_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {team.team_type?.replace("_", " ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {team.member_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {team.project_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {team.total_tasks || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    {team.completed_tasks || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-debo-primary rounded-full h-2 transition-all"
                          style={{ width: `${team.completion_rate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {team.completion_rate || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {teamPerformance.length === 0 && (
                <tr key="no-team-data">
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No team performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Productivity */}
      {userProductivity && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Productivity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Tasks Assigned</p>
              <p className="text-2xl font-bold text-gray-800">
                {userProductivity.total_tasks_assigned || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Tasks Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {userProductivity.tasks_completed || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {userProductivity.completion_rate || 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Overdue Tasks</p>
              <p className="text-2xl font-bold text-red-600">
                {userProductivity.overdue_tasks || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
