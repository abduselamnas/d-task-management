const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server running', timestamp: new Date().toISOString() });
});

// Mock users
const users = [
    { id: 1, email: 'admin@debo.com', password: 'Admin@123', full_name: 'Admin User', role: 'admin' },
    { id: 2, email: 'manager@debo.com', password: 'Admin@123', full_name: 'Manager User', role: 'project_manager' },
    { id: 3, email: 'team@debo.com', password: 'Admin@123', full_name: 'Team Member', role: 'team_member' }
];

// Mock data
const projects = [
    { id: 1, name: 'Debo Task Management System', status: 'active', progress: 75, total_tasks: 10, completed_tasks: 7, manager_name: 'Admin User' }
];

const tasks = [
    { id: 1, title: 'Design Database Schema', status: 'completed', priority: 'high', progress_percentage: 100, project_name: 'Debo Task Management System' }
];

// Auth middleware
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET || 'secretkey123',
        { expiresIn: '7d' }
    );
    res.json({ success: true, token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { email, password, full_name, role = 'team_member' } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const newUser = { id: users.length + 1, email, password, full_name, role };
    users.push(newUser);
    const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role, full_name: newUser.full_name },
        process.env.JWT_SECRET || 'secretkey123',
        { expiresIn: '7d' }
    );
    res.status(201).json({ success: true, token, user: newUser });
});

// Projects
app.get('/api/projects', auth, (req, res) => res.json(projects));

// Tasks
app.get('/api/tasks', auth, (req, res) => res.json(tasks));

// Teams
app.get('/api/teams', auth, (req, res) => res.json([]));

// Reports
app.get('/api/reports/project-summary', auth, (req, res) => res.json(projects));
app.get('/api/reports/user-productivity', auth, (req, res) => res.json({ total_tasks_assigned: 5 }));

// Users
app.get('/api/users', auth, (req, res) => res.json(users));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Export for Vercel
module.exports = app;

// Local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });
}