const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get tasks with filters
// @access  Private
router.get('/', auth, async (req, res) => {
    const { project_id, assigned_to, status, priority, search } = req.query;
    
    try {
        let query = `
            SELECT 
                t.*,
                u.full_name as assignee_name,
                assigned.full_name as assigner_name,
                p.name as project_name,
                p.status as project_status
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users assigned ON t.assigned_by = assigned.id
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (project_id) {
            query += ` AND t.project_id = ?`;
            params.push(project_id);
        }
        
        if (assigned_to) {
            query += ` AND t.assigned_to = ?`;
            params.push(assigned_to);
        } else if (req.user.role === 'team_member') {
            query += ` AND t.assigned_to = ?`;
            params.push(req.user.id);
        }
        
        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        
        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }
        
        if (search) {
            query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY FIELD(t.priority, 'urgent', 'high', 'medium', 'low'), t.due_date ASC, t.created_at DESC`;
        
        const [tasks] = await db.query(query, params);
        
        // Add days until due
        const tasksWithMeta = tasks.map(task => ({
            ...task,
            days_until_due: task.due_date ? Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null,
            is_overdue: task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
        }));
        
        res.json(tasksWithMeta);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// @route   GET /api/tasks/:id
// @desc    Get single task with details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT 
                t.*,
                u.full_name as assignee_name,
                u.email as assignee_email,
                assigned.full_name as assigner_name,
                p.name as project_name,
                p.id as project_id
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users assigned ON t.assigned_by = assigned.id
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const task = tasks[0];
        
        // Get comments
        const [comments] = await db.query(`
            SELECT tc.*, u.full_name, u.email
            FROM task_comments tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.task_id = ?
            ORDER BY tc.created_at DESC
        `, [req.params.id]);
        
        // Get task history
        const [history] = await db.query(`
            SELECT th.*, u.full_name
            FROM task_history th
            JOIN users u ON th.user_id = u.id
            WHERE th.task_id = ?
            ORDER BY th.changed_at DESC
            LIMIT 20
        `, [req.params.id]);
        
        res.json({
            ...task,
            comments,
            history
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Error fetching task details' });
    }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (Admin or Project Manager)
router.post('/', auth, checkRole(['admin', 'project_manager']), [
    body('title').notEmpty().withMessage('Task title is required'),
    body('project_id').isInt().withMessage('Valid project ID is required'),
    body('assigned_to').optional().isInt(),
    body('due_date').optional().isDate(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('estimated_hours').optional().isFloat({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
        title, description, project_id, assigned_to, due_date, 
        priority = 'medium', start_date, estimated_hours 
    } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO tasks (title, description, project_id, assigned_to, assigned_by, 
                               due_date, priority, start_date, estimated_hours, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [title, description, project_id, assigned_to || null, req.user.id, 
             due_date || null, priority, start_date || null, estimated_hours || null]
        );
        
        // Update project task counts
        await db.query(`
            UPDATE projects 
            SET total_tasks = total_tasks + 1
            WHERE id = ?
        `, [project_id]);
        
        // Log activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'create_task', 'task', result.insertId, JSON.stringify({ title, project_id, assigned_to })]
        );
        
        const [newTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: newTask[0]
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Error creating task' });
    }
});

// @route   PATCH /api/tasks/:id/status
// @desc    Update task status and progress (for team members)
// @access  Private
router.patch('/:id/status', auth, [
    body('status').optional().isIn(['pending', 'started', 'in_progress', 'review', 'completed']),
    body('progress_percentage').optional().isInt({ min: 0, max: 100 })
], async (req, res) => {
    const { status, progress_percentage } = req.body;
    
    try {
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const task = tasks[0];
        const oldStatus = task.status;
        const oldProgress = task.progress_percentage;
        
        // Check permission
        if (req.user.role !== 'admin' && 
            req.user.role !== 'project_manager' && 
            task.assigned_to !== req.user.id) {
            return res.status(403).json({ message: 'You don\'t have permission to update this task' });
        }
        
        let updateFields = [];
        let params = [];
        let changes = [];
        
        if (status && status !== oldStatus) {
            updateFields.push('status = ?');
            params.push(status);
            changes.push(`status: ${oldStatus} → ${status}`);
            
            if (status === 'completed') {
                updateFields.push('completed_date = NOW()');
                updateFields.push('progress_percentage = 100');
                changes.push('marked as completed');
            }
        }
        
        if (progress_percentage !== undefined && progress_percentage !== oldProgress) {
            updateFields.push('progress_percentage = ?');
            params.push(progress_percentage);
            changes.push(`progress: ${oldProgress}% → ${progress_percentage}%`);
            
            if (progress_percentage === 100 && (!status || status !== 'completed')) {
                updateFields.push('status = "completed"');
                updateFields.push('completed_date = NOW()');
                changes.push('auto-completed due to 100% progress');
            } else if (progress_percentage > 0 && progress_percentage < 100 && (!status || status === 'pending')) {
                updateFields.push('status = "in_progress"');
                changes.push('status changed to in_progress');
            }
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No changes to update' });
        }
        
        params.push(req.params.id);
        await db.query(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`, params);
        
        // Record task history
        if (changes.length > 0) {
            await db.query(
                `INSERT INTO task_history (task_id, user_id, field_name, old_value, new_value) 
                 VALUES (?, ?, ?, ?, ?)`,
                [req.params.id, req.user.id, 'status_progress', oldStatus, status || `progress: ${progress_percentage}%`]
            );
        }
        
        // Update project completed tasks count if task completed
        if (status === 'completed' && oldStatus !== 'completed') {
            await db.query(`
                UPDATE projects 
                SET completed_tasks = completed_tasks + 1,
                    progress_percentage = (completed_tasks + 1) / total_tasks * 100
                WHERE id = ?
            `, [task.project_id]);
        }
        
        // Log activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, 'update_task_status', 'task', req.params.id, JSON.stringify({ changes })]
        );
        
        res.json({
            success: true,
            message: 'Task updated successfully',
            changes
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Error updating task' });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task (full update - managers only)
// @access  Private (Admin or Project Manager)
router.put('/:id', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    const { title, description, assigned_to, due_date, priority, status, progress_percentage, estimated_hours } = req.body;
    
    try {
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const updates = [];
        const values = [];
        const changes = [];
        
        if (title && title !== tasks[0].title) {
            updates.push('title = ?');
            values.push(title);
            changes.push(`title: "${tasks[0].title}" → "${title}"`);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (assigned_to !== undefined && assigned_to !== tasks[0].assigned_to) {
            updates.push('assigned_to = ?');
            values.push(assigned_to);
            changes.push(`assigned_to changed`);
        }
        if (due_date !== undefined) {
            updates.push('due_date = ?');
            values.push(due_date || null);
            changes.push(`due_date updated`);
        }
        if (priority && priority !== tasks[0].priority) {
            updates.push('priority = ?');
            values.push(priority);
            changes.push(`priority: ${tasks[0].priority} → ${priority}`);
        }
        if (status && status !== tasks[0].status) {
            updates.push('status = ?');
            values.push(status);
            changes.push(`status: ${tasks[0].status} → ${status}`);
            if (status === 'completed') {
                updates.push('completed_date = NOW()');
            }
        }
        if (progress_percentage !== undefined && progress_percentage !== tasks[0].progress_percentage) {
            updates.push('progress_percentage = ?');
            values.push(progress_percentage);
            changes.push(`progress: ${tasks[0].progress_percentage}% → ${progress_percentage}%`);
        }
        if (estimated_hours !== undefined) {
            updates.push('estimated_hours = ?');
            values.push(estimated_hours);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        values.push(req.params.id);
        await db.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
        
        // Record task history
        if (changes.length > 0) {
            await db.query(
                `INSERT INTO task_history (task_id, user_id, field_name, old_value, new_value) 
                 VALUES (?, ?, ?, ?, ?)`,
                [req.params.id, req.user.id, 'task_update', JSON.stringify(tasks[0]), JSON.stringify(req.body)]
            );
        }
        
        res.json({
            success: true,
            message: 'Task updated successfully',
            changes
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Error updating task' });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (Admin or Project Manager)
router.delete('/:id', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    try {
        const [tasks] = await db.query('SELECT title, project_id FROM tasks WHERE id = ?', [req.params.id]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        
        // Update project task counts
        await db.query(`
            UPDATE projects 
            SET total_tasks = total_tasks - 1
            WHERE id = ?
        `, [tasks[0].project_id]);
        
        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Error deleting task' });
    }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', auth, [
    body('comment').notEmpty().withMessage('Comment cannot be empty')
], async (req, res) => {
    const { comment } = req.body;
    
    try {
        await db.query(
            'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
            [req.params.id, req.user.id, comment]
        );
        
        res.status(201).json({
            success: true,
            message: 'Comment added successfully'
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

module.exports = router;