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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Debo Task Management API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Mock users database
const users = [
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

// Mock data
const projects = [
    { id: 1, name: 'Debo Task Management System', status: 'active', progress: 75, total_tasks: 10, completed_tasks: 7, overdue_tasks: 0, manager_name: 'Admin User', team_name: 'Backend Team' },
    { id: 2, name: 'Mobile App Development', status: 'planning', progress: 30, total_tasks: 8, completed_tasks: 2, overdue_tasks: 1, manager_name: 'Manager User', team_name: 'Mobile Team' }
];

const tasks = [
    { id: 1, title: 'Design Database Schema', status: 'completed', priority: 'high', progress_percentage: 100, project_name: 'Debo Task Management System', assignee_name: 'Sarah Chen', due_date: '2026-01-15' },
    { id: 2, title: 'Implement Authentication API', status: 'completed', priority: 'high', progress_percentage: 100, project_name: 'Debo Task Management System', assignee_name: 'Mike Johnson', due_date: '2026-01-20' },
    { id: 3, title: 'Create React Components', status: 'in_progress', priority: 'high', progress_percentage: 60, project_name: 'Debo Task Management System', assignee_name: 'Team Member', due_date: '2026-02-10' }
];

const teams = [
    { id: 1, name: 'Backend Team', team_type: 'backend', member_count: 3, project_count: 2, total_tasks: 5, completed_tasks: 3, completion_rate: 60 },
    { id: 2, name: 'Frontend Team', team_type: 'frontend_web', member_count: 2, project_count: 1, total_tasks: 3, completed_tasks: 1, completion_rate: 33 }
];

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET || 'secretkey123',
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

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { email, password, full_name, role = 'team_member' } = req.body;
    
    console.log('Register attempt:', email);
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const newUser = {
        id: users.length + 1,
        email,
        password,
        full_name,
        role: role === 'admin' ? 'team_member' : role
    };
    
    users.push(newUser);
    
    const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role, full_name: newUser.full_name },
        process.env.JWT_SECRET || 'secretkey123',
        { expiresIn: '7d' }
    );
    
    res.status(201).json({
        success: true,
        token: token,
        user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role
        }
    });
});

// Auth middleware
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Projects routes
app.get('/api/projects', auth, (req, res) => {
    res.json(projects);
});

app.get('/api/projects/:id', auth, (req, res) => {
    const project = projects.find(p => p.id === parseInt(req.params.id));
    res.json(project || {});
});

// Tasks routes
app.get('/api/tasks', auth, (req, res) => {
    res.json(tasks);
});

app.get('/api/tasks/:id', auth, (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    res.json(task || {});
});

app.patch('/api/tasks/:id/status', auth, (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        const { status, progress_percentage } = req.body;
        if (status) tasks[taskIndex].status = status;
        if (progress_percentage !== undefined) tasks[taskIndex].progress_percentage = progress_percentage;
        res.json({ success: true, task: tasks[taskIndex] });
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
});

// Teams routes
app.get('/api/teams', auth, (req, res) => {
    res.json(teams);
});

// Users routes
app.get('/api/users', auth, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    const usersList = users.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role
    }));
    res.json(usersList);
});

// Reports routes
app.get('/api/reports/project-summary', auth, (req, res) => {
    const summary = projects.map(p => ({
        id: p.id,
        project_name: p.name,
        status: p.status,
        total_tasks: p.total_tasks,
        completed_tasks: p.completed_tasks,
        overdue_tasks: p.overdue_tasks || 0,
        progress_percentage: p.progress,
        manager_name: p.manager_name,
        team_name: p.team_name
    }));
    res.json(summary);
});

app.get('/api/reports/team-performance', auth, (req, res) => {
    res.json(teams);
});

app.get('/api/reports/user-productivity', auth, (req, res) => {
    res.json({
        total_tasks_assigned: 5,
        tasks_completed: 3,
        completion_rate: 60,
        overdue_tasks: 1
    });
});

app.get('/api/reports/task-summary', auth, (req, res) => {
    res.json([
        { status: 'completed', task_count: 2 },
        { status: 'in_progress', task_count: 1 },
        { status: 'pending', task_count: 2 }
    ]);
});

app.get('/api/reports/export/projects', auth, (req, res) => {
    const exportData = projects.map(p => ({
        'Project Name': p.name,
        'Status': p.status,
        'Progress %': p.progress,
        'Total Tasks': p.total_tasks,
        'Completed Tasks': p.completed_tasks,
        'Manager': p.manager_name,
        'Team': p.team_name
    }));
    res.json({ data: exportData });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found', url: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});