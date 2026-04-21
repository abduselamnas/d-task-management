const express = require('express');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/project-summary
// @desc    Get project summary report
// @access  Private (Admin, Project Manager)
router.get('/project-summary', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    try {
        let query = `
            SELECT 
                p.id,
                p.name as project_name,
                p.status,
                p.priority,
                p.start_date,
                p.end_date,
                p.progress_percentage,
                u.full_name as manager_name,
                t.name as team_name,
                COUNT(DISTINCT ts.id) as total_tasks,
                SUM(CASE WHEN ts.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN ts.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
                SUM(CASE WHEN ts.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
                SUM(CASE WHEN ts.status = 'review' THEN 1 ELSE 0 END) as review_tasks,
                SUM(CASE WHEN ts.due_date < CURDATE() AND ts.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks,
                ROUND(AVG(ts.progress_percentage), 1) as avg_task_progress,
                COUNT(DISTINCT ts.assigned_to) as active_members
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            LEFT JOIN teams t ON p.team_id = t.id
            LEFT JOIN tasks ts ON p.id = ts.project_id
        `;
        
        const params = [];
        
        if (req.user.role === 'project_manager') {
            query += ` WHERE p.manager_id = ?`;
            params.push(req.user.id);
        }
        
        query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
        
        const [reports] = await db.query(query, params);
        
        // Calculate completion rate
        const reportsWithRate = reports.map(report => ({
            ...report,
            completion_rate: report.total_tasks > 0 
                ? ((report.completed_tasks / report.total_tasks) * 100).toFixed(1)
                : 0,
            days_remaining: report.end_date 
                ? Math.max(0, Math.ceil((new Date(report.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
                : null
        }));
        
        res.json(reportsWithRate);
    } catch (error) {
        console.error('Project summary error:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// @route   GET /api/reports/team-performance
// @desc    Get team performance report
// @access  Private (Admin, Project Manager)
router.get('/team-performance', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT 
                t.id as team_id,
                t.name as team_name,
                t.team_type,
                COUNT(DISTINCT u.id) as member_count,
                COUNT(DISTINCT p.id) as project_count,
                COUNT(DISTINCT ts.id) as total_tasks,
                SUM(CASE WHEN ts.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                ROUND(AVG(ts.progress_percentage), 1) as avg_progress,
                SUM(CASE WHEN ts.due_date < CURDATE() AND ts.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks,
                SUM(ts.actual_hours) as total_hours_spent,
                SUM(ts.estimated_hours) as total_estimated_hours
            FROM teams t
            LEFT JOIN users u ON t.id = u.team_id AND u.is_active = true
            LEFT JOIN projects p ON t.id = p.team_id
            LEFT JOIN tasks ts ON p.id = ts.project_id
            GROUP BY t.id
            ORDER BY t.team_type
        `);
        
        const reportsWithMetrics = reports.map(report => ({
            ...report,
            completion_rate: report.total_tasks > 0 
                ? ((report.completed_tasks / report.total_tasks) * 100).toFixed(1)
                : 0,
            efficiency: report.total_estimated_hours > 0
                ? ((report.total_estimated_hours / report.total_hours_spent) * 100).toFixed(1)
                : 0
        }));
        
        res.json(reportsWithMetrics);
    } catch (error) {
        console.error('Team performance error:', error);
        res.status(500).json({ message: 'Error generating team performance report' });
    }
});

// @route   GET /api/reports/user-productivity
// @desc    Get current user productivity report
// @access  Private
router.get('/user-productivity', auth, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [report] = await db.query(`
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.role,
                t.name as team_name,
                COUNT(DISTINCT ts.id) as total_tasks_assigned,
                SUM(CASE WHEN ts.status = 'completed' THEN 1 ELSE 0 END) as tasks_completed,
                SUM(CASE WHEN ts.status = 'in_progress' THEN 1 ELSE 0 END) as tasks_in_progress,
                SUM(CASE WHEN ts.status = 'pending' THEN 1 ELSE 0 END) as tasks_pending,
                ROUND(AVG(ts.progress_percentage), 1) as avg_progress,
                SUM(CASE WHEN ts.due_date < CURDATE() AND ts.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks,
                SUM(ts.actual_hours) as total_hours_logged,
                COUNT(DISTINCT ts.project_id) as projects_worked_on,
                MAX(ts.completed_date) as last_completion_date
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN tasks ts ON u.id = ts.assigned_to
            WHERE u.id = ?
            GROUP BY u.id
        `, [userId]);
        
        if (report.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userReport = report[0];
        userReport.completion_rate = userReport.total_tasks_assigned > 0
            ? ((userReport.tasks_completed / userReport.total_tasks_assigned) * 100).toFixed(1)
            : 0;
        
        // Get task completion timeline
        const [timeline] = await db.query(`
            SELECT 
                DATE(completed_date) as date,
                COUNT(*) as tasks_completed
            FROM tasks
            WHERE assigned_to = ? AND status = 'completed' AND completed_date IS NOT NULL
            GROUP BY DATE(completed_date)
            ORDER BY date DESC
            LIMIT 30
        `, [userId]);
        
        res.json({
            ...userReport,
            completion_timeline: timeline
        });
    } catch (error) {
        console.error('User productivity error:', error);
        res.status(500).json({ message: 'Error generating user productivity report' });
    }
});

// @route   GET /api/reports/user-productivity/:user_id
// @desc    Get specific user productivity report (Admin/Manager only)
// @access  Private (Admin, Project Manager)
router.get('/user-productivity/:user_id', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    const userId = req.params.user_id;
    
    try {
        const [report] = await db.query(`
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.role,
                t.name as team_name,
                COUNT(DISTINCT ts.id) as total_tasks_assigned,
                SUM(CASE WHEN ts.status = 'completed' THEN 1 ELSE 0 END) as tasks_completed,
                SUM(CASE WHEN ts.status = 'in_progress' THEN 1 ELSE 0 END) as tasks_in_progress,
                SUM(CASE WHEN ts.status = 'pending' THEN 1 ELSE 0 END) as tasks_pending,
                ROUND(AVG(ts.progress_percentage), 1) as avg_progress,
                SUM(CASE WHEN ts.due_date < CURDATE() AND ts.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks,
                SUM(ts.actual_hours) as total_hours_logged,
                COUNT(DISTINCT ts.project_id) as projects_worked_on,
                MAX(ts.completed_date) as last_completion_date
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN tasks ts ON u.id = ts.assigned_to
            WHERE u.id = ?
            GROUP BY u.id
        `, [userId]);
        
        if (report.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userReport = report[0];
        userReport.completion_rate = userReport.total_tasks_assigned > 0
            ? ((userReport.tasks_completed / userReport.total_tasks_assigned) * 100).toFixed(1)
            : 0;
        
        res.json(userReport);
    } catch (error) {
        console.error('User productivity error:', error);
        res.status(500).json({ message: 'Error generating user productivity report' });
    }
});

// @route   GET /api/reports/task-summary
// @desc    Get task summary report with filters
// @access  Private (Admin, Project Manager)
router.get('/task-summary', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    const { start_date, end_date, project_id, team_id } = req.query;
    
    try {
        let query = `
            SELECT 
                ts.status,
                ts.priority,
                COUNT(*) as task_count,
                ROUND(AVG(ts.progress_percentage), 1) as avg_progress,
                COUNT(DISTINCT ts.project_id) as projects_affected,
                COUNT(DISTINCT ts.assigned_to) as assignees_count
            FROM tasks ts
            JOIN projects p ON ts.project_id = p.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (start_date && end_date) {
            query += ` AND ts.created_at BETWEEN ? AND ?`;
            params.push(start_date, end_date);
        }
        
        if (project_id) {
            query += ` AND ts.project_id = ?`;
            params.push(project_id);
        }
        
        if (team_id) {
            query += ` AND p.team_id = ?`;
            params.push(team_id);
        }
        
        if (req.user.role === 'project_manager') {
            query += ` AND p.manager_id = ?`;
            params.push(req.user.id);
        }
        
        query += ` GROUP BY ts.status, ts.priority ORDER BY ts.status, FIELD(ts.priority, 'urgent', 'high', 'medium', 'low')`;
        
        const [summary] = await db.query(query, params);
        
        res.json(summary);
    } catch (error) {
        console.error('Task summary error:', error);
        res.status(500).json({ message: 'Error generating task summary' });
    }
});

// @route   GET /api/reports/export/projects
// @desc    Export projects data to CSV
// @access  Private (Admin, Project Manager)
router.get('/export/projects', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    try {
        let query = `
            SELECT 
                p.name as 'Project Name',
                p.status as 'Status',
                p.priority as 'Priority',
                p.start_date as 'Start Date',
                p.end_date as 'End Date',
                p.progress_percentage as 'Progress %',
                u.full_name as 'Manager',
                t.name as 'Team',
                p.total_tasks as 'Total Tasks',
                p.completed_tasks as 'Completed Tasks'
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            LEFT JOIN teams t ON p.team_id = t.id
        `;
        
        const params = [];
        
        if (req.user.role === 'project_manager') {
            query += ` WHERE p.manager_id = ?`;
            params.push(req.user.id);
        }
        
        query += ` ORDER BY p.created_at DESC`;
        
        const [projects] = await db.query(query, params);
        
        res.json({
            data: projects,
            export_date: new Date().toISOString(),
            total_records: projects.length
        });
    } catch (error) {
        console.error('Export projects error:', error);
        res.status(500).json({ message: 'Error exporting projects data' });
    }
});

module.exports = router;