const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects with filters
// @access  Private (role-based)
router.get('/', auth, async (req, res) => {
    try {
        let query = `
            SELECT 
                p.*,
                u.full_name as manager_name,
                t.name as team_name,
                COUNT(DISTINCT ts.id) as total_tasks,
                SUM(CASE WHEN ts.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                AVG(ts.progress_percentage) as avg_progress,
                SUM(CASE WHEN ts.due_date < CURDATE() AND ts.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            LEFT JOIN teams t ON p.team_id = t.id
            LEFT JOIN tasks ts ON p.id = ts.project_id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Role-based filtering
        if (req.user.role === 'team_member') {
            query += ` AND p.id IN (
                SELECT DISTINCT project_id 
                FROM tasks 
                WHERE assigned_to = ?
            )`;
            params.push(req.user.id);
        } else if (req.user.role === 'project_manager') {
            query += ` AND p.manager_id = ?`;
            params.push(req.user.id);
        }
        
        // Apply status filter
        if (req.query.status) {
            query += ` AND p.status = ?`;
            params.push(req.query.status);
        }
        
        // Apply team filter
        if (req.query.team_id) {
            query += ` AND p.team_id = ?`;
            params.push(req.query.team_id);
        }
        
        query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
        
        const [projects] = await db.query(query, params);
        
        // Calculate progress percentage for each project
        const projectsWithProgress = projects.map(project => ({
            ...project,
            progress: project.total_tasks > 0 
                ? Math.round((project.completed_tasks / project.total_tasks) * 100)
                : 0,
            completion_rate: project.total_tasks > 0
                ? ((project.completed_tasks / project.total_tasks) * 100).toFixed(1)
                : 0
        }));
        
        res.json(projectsWithProgress);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

// @route   GET /api/projects/:id
// @desc    Get single project with details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        // Get project details
        const [projects] = await db.query(`
            SELECT p.*, u.full_name as manager_name, t.name as team_name
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        const project = projects[0];
        
        // Get project tasks
        const [tasks] = await db.query(`
            SELECT t.*, u.full_name as assignee_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = ?
            ORDER BY t.due_date ASC, t.priority DESC
        `, [req.params.id]);
        
        // Get project teams
        const [teams] = await db.query(`
            SELECT t.* 
            FROM teams t
            JOIN project_teams pt ON t.id = pt.team_id
            WHERE pt.project_id = ?
        `, [req.params.id]);
        
        // Get project statistics
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
                AVG(progress_percentage) as avg_progress
            FROM tasks
            WHERE project_id = ?
        `, [req.params.id]);
        
        res.json({
            ...project,
            tasks,
            teams,
            statistics: stats[0]
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Error fetching project details' });
    }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (Admin or Project Manager)
router.post('/', auth, checkRole(['admin', 'project_manager']), [
    body('name').notEmpty().withMessage('Project name is required'),
    body('description').optional(),
    body('start_date').optional().isDate(),
    body('end_date').optional().isDate(),
    body('team_id').optional().isInt(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('status').optional().isIn(['planning', 'active', 'in_review', 'completed', 'on_hold'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, start_date, end_date, team_id, priority = 'medium', status = 'planning' } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO projects (name, description, start_date, end_date, manager_id, team_id, priority, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description, start_date || null, end_date || null, req.user.id, team_id || null, priority, status]
        );
        
        // Log activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'create_project', 'project', result.insertId, JSON.stringify({ name, priority })]
        );
        
        const [newProject] = await db.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project: newProject[0]
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Error creating project' });
    }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin or Project Manager of this project)
router.put('/:id', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    const { name, description, status, priority, start_date, end_date, team_id } = req.body;
    
    try {
        // Check permission
        const [projects] = await db.query(
            'SELECT manager_id, name FROM projects WHERE id = ?',
            [req.params.id]
        );
        
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        if (req.user.role !== 'admin' && projects[0].manager_id !== req.user.id) {
            return res.status(403).json({ message: 'You don\'t have permission to update this project' });
        }
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (status) { updates.push('status = ?'); values.push(status); }
        if (priority) { updates.push('priority = ?'); values.push(priority); }
        if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date || null); }
        if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date || null); }
        if (team_id !== undefined) { updates.push('team_id = ?'); values.push(team_id || null); }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        values.push(req.params.id);
        await db.query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
        
        // Log activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'update_project', 'project', req.params.id, JSON.stringify({ updated_fields: updates })]
        );
        
        res.json({
            success: true,
            message: 'Project updated successfully'
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Error updating project' });
    }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const [projects] = await db.query('SELECT name FROM projects WHERE id = ?', [req.params.id]);
        
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        
        // Log activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'delete_project', 'project', req.params.id, JSON.stringify({ name: projects[0].name })]
        );
        
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Error deleting project' });
    }
});

// @route   GET /api/projects/:id/progress
// @desc    Get project progress timeline
// @access  Private
router.get('/:id/progress', auth, async (req, res) => {
    try {
        const [progress] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as tasks_created,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tasks_completed,
                AVG(progress_percentage) as avg_progress
            FROM tasks
            WHERE project_id = ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [req.params.id]);
        
        res.json(progress);
    } catch (error) {
        console.error('Get project progress error:', error);
        res.status(500).json({ message: 'Error fetching project progress' });
    }
});

module.exports = router;