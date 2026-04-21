const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    if (!email || !password) {
        return res.status(400).json({ 
            message: 'Email and password are required' 
        });
    }
    
    try {
        // Query without is_active column
        const [users] = await db.query(
            `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.team_id,
                    t.name as team_name
             FROM users u
             LEFT JOIN teams t ON u.team_id = t.id
             WHERE u.email = ?`,
            [email.toLowerCase()]
        );
        
        console.log('Users found:', users.length);
        
        if (users.length === 0) {
            // For demo purposes, create a test user if doesn't exist
            if (email === 'admin@debo.com') {
                // Create a test admin user
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('Admin@123', salt);
                
                const [result] = await db.query(
                    `INSERT INTO users (email, password_hash, full_name, role) 
                     VALUES (?, ?, ?, ?)`,
                    [email, hashedPassword, 'System Admin', 'admin']
                );
                
                const token = jwt.sign(
                    { id: result.insertId, email, role: 'admin', full_name: 'System Admin' },
                    process.env.JWT_SECRET || 'secretkey',
                    { expiresIn: '7d' }
                );
                
                return res.json({
                    success: true,
                    token,
                    user: {
                        id: result.insertId,
                        email,
                        full_name: 'System Admin',
                        role: 'admin',
                        team_id: null
                    }
                });
            }
            
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const user = users[0];
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                team_id: user.team_id,
                team_name: user.team_name
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Register endpoint
router.post('/register', async (req, res) => {
    const { email, password, full_name, role = 'team_member', team_id } = req.body;
    
    if (!email || !password || !full_name) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {
        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insert user without is_active
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, full_name, role, team_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, hashedPassword, full_name, role, team_id || null]
        );
        
        const token = jwt.sign(
            { id: result.insertId, email, role, full_name },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: result.insertId,
                email,
                full_name,
                role,
                team_id: team_id || null
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    const token = req.headers['x-auth-token'];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        const [users] = await db.query(
            `SELECT u.id, u.email, u.full_name, u.role, u.team_id,
                    t.name as team_name
             FROM users u
             LEFT JOIN teams t ON u.team_id = t.id
             WHERE u.id = ?`,
            [decoded.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;