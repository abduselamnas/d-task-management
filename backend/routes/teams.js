const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all teams
router.get('/', auth, async (req, res) => {
    try {
        const [teams] = await db.query(`
            SELECT t.*, 
                   COUNT(DISTINCT u.id) as member_count,
                   COUNT(DISTINCT p.id) as project_count,
                   creator.full_name as created_by_name
            FROM teams t
            LEFT JOIN users u ON t.id = u.team_id AND u.is_active = true
            LEFT JOIN projects p ON t.id = p.team_id
            LEFT JOIN users creator ON t.created_by = creator.id
            GROUP BY t.id
            ORDER BY t.team_type, t.name
        `);
        
        res.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ message: 'Error fetching teams' });
    }
});

// Get single team
router.get('/:id', auth, async (req, res) => {
    try {
        const [teams] = await db.query(`
            SELECT t.*, creator.full_name as created_by_name
            FROM teams t
            LEFT JOIN users creator ON t.created_by = creator.id
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (teams.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        // Get team members
        const [members] = await db.query(`
            SELECT id, email, full_name, role, created_at
            FROM users
            WHERE team_id = ? AND is_active = true
        `, [req.params.id]);
        
        // Get team projects
        const [projects] = await db.query(`
            SELECT id, name, status, priority, progress_percentage, start_date, end_date
            FROM projects
            WHERE team_id = ?
            ORDER BY created_at DESC
        `, [req.params.id]);
        
        res.json({
            ...teams[0],
            members,
            projects
        });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ message: 'Error fetching team details' });
    }
});

// Create team
router.post('/', auth, checkRole(['admin']), [
    body('name').notEmpty().withMessage('Team name is required'),
    body('team_type').isIn(['backend', 'frontend_web', 'mobile', 'ui_ux']).withMessage('Invalid team type'),
    body('description').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, team_type } = req.body;
    
    try {
        const [result] = await db.query(
            'INSERT INTO teams (name, description, team_type, created_by) VALUES (?, ?, ?, ?)',
            [name, description, team_type, req.user.id]
        );
        
        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            team: { id: result.insertId, name, description, team_type }
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ message: 'Error creating team' });
    }
});

// Update team
router.put('/:id', auth, checkRole(['admin']), async (req, res) => {
    const { name, description, team_type } = req.body;
    
    try {
        const updates = [];
        const values = [];
        
        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (team_type) {
            updates.push('team_type = ?');
            values.push(team_type);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        values.push(req.params.id);
        await db.query(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`, values);
        
        res.json({
            success: true,
            message: 'Team updated successfully'
        });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ message: 'Error updating team' });
    }
});

// Delete team
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const [teams] = await db.query('SELECT name FROM teams WHERE id = ?', [req.params.id]);
        
        if (teams.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        await db.query('DELETE FROM teams WHERE id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ message: 'Error deleting team' });
    }
});

// Add member to team
router.post('/:id/members', auth, checkRole(['admin']), [
    body('user_id').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
    const { user_id } = req.body;
    
    try {
        await db.query('UPDATE users SET team_id = ? WHERE id = ?', [req.params.id, user_id]);
        
        res.json({
            success: true,
            message: 'User added to team successfully'
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'Error adding user to team' });
    }
});

// Remove member from team
router.delete('/:id/members/:user_id', auth, checkRole(['admin']), async (req, res) => {
    try {
        await db.query('UPDATE users SET team_id = NULL WHERE id = ?', [req.params.user_id]);
        
        res.json({
            success: true,
            message: 'User removed from team successfully'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Error removing user from team' });
    }
});

module.exports = router;