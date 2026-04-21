const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/', auth, checkRole(['admin', 'project_manager']), async (req, res) => {
    try {
        let query = `
            SELECT u.id, u.email, u.full_name, u.role, u.team_id, u.is_active, u.created_at,
                   t.name as team_name
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
        `;
        
        const params = [];
        
        if (req.user.role === 'project_manager') {
            query += ` WHERE u.role = 'team_member'`;
        }
        
        query += ` ORDER BY u.created_at DESC`;
        
        const [users] = await db.query(query, params);
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Get single user
router.get('/:id', auth, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.email, u.full_name, u.role, u.team_id, u.is_active, u.created_at,
                   t.name as team_name
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.id = ?
        `, [req.params.id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check permission
        if (req.user.role !== 'admin' && req.user.id != req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Create user (admin only)
router.post('/', auth, checkRole(['admin']), [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('role').isIn(['admin', 'project_manager', 'team_member']).withMessage('Invalid role'),
    body('team_id').optional().isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, full_name, role, team_id } = req.body;
    
    try {
        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [result] = await db.query(
            'INSERT INTO users (email, password_hash, full_name, role, team_id, is_active) VALUES (?, ?, ?, ?, ?, true)',
            [email, hashedPassword, full_name, role, team_id || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: { id: result.insertId, email, full_name, role, team_id }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Update user
router.put('/:id', auth, async (req, res) => {
    const { full_name, role, team_id, is_active } = req.body;
    
    try {
        // Check permission
        if (req.user.role !== 'admin' && req.user.id != req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Only admin can change role and is_active
        if ((role || is_active !== undefined) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can change role or status' });
        }
        
        const updates = [];
        const values = [];
        
        if (full_name) {
            updates.push('full_name = ?');
            values.push(full_name);
        }
        if (role && req.user.role === 'admin') {
            updates.push('role = ?');
            values.push(role);
        }
        if (team_id !== undefined) {
            updates.push('team_id = ?');
            values.push(team_id || null);
        }
        if (is_active !== undefined && req.user.role === 'admin') {
            updates.push('is_active = ?');
            values.push(is_active);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        values.push(req.params.id);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        
        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete user (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const [users] = await db.query('SELECT email FROM users WHERE id = ?', [req.params.id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router;