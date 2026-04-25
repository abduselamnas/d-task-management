const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory users array (for demo purposes)
let users = [
    {
        id: 1,
        email: 'admin@debo.com',
        password: 'Admin@123',
        full_name: 'Admin User',
        role: 'admin'
    },
    {
        id: 2,
        email: 'manager@debo.com',
        password: 'Admin@123',
        full_name: 'Manager User',
        role: 'project_manager'
    },
    {
        id: 3,
        email: 'team@debo.com',
        password: 'Admin@123',
        full_name: 'Team Member',
        role: 'team_member'
    }
];

// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email and password are required' 
        });
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ 
            success: false,
            message: 'Invalid email or password' 
        });
    }
    
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        'secretkey123',
        { expiresIn: '7d' }
    );
    
    res.json({
        success: true,
        token: token,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        }
    });
});

// Register endpoint - FIXED
router.post('/register', (req, res) => {
    const { email, password, full_name, role = 'team_member' } = req.body;
    
    console.log('Registration attempt:', { email, full_name, role });
    
    // Validate required fields
    if (!email || !password || !full_name) {
        return res.status(400).json({ 
            success: false,
            message: 'All fields are required' 
        });
    }
    
    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false,
            message: 'Password must be at least 6 characters' 
        });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ 
            success: false,
            message: 'User with this email already exists' 
        });
    }
    
    // Create new user
    const newUser = {
        id: users.length + 1,
        email,
        password, // In production, you would hash this
        full_name,
        role: role === 'admin' ? 'team_member' : role, // Prevent self-registration as admin
        created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    console.log('New user created:', newUser);
    console.log('Total users:', users.length);
    
    // Create token for auto-login
    const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role, full_name: newUser.full_name },
        'secretkey123',
        { expiresIn: '7d' }
    );
    
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: token,
        user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role
        }
    });
});

// Get current user
router.get('/me', (req, res) => {
    const token = req.headers['x-auth-token'];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, 'secretkey123');
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;