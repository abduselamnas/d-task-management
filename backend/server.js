const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://YOUR_USERNAME.github.io'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
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
  { id: 1, name: 'Debo Task Management System', status: 'active', progress: 75, total_tasks: 10, completed_tasks: 7, manager_name: 'Admin User' },
  { id: 2, name: 'Mobile App Development', status: 'planning', progress: 30, total_tasks: 8, completed_tasks: 2, manager_name: 'Manager User' }
];

const tasks = [
  { id: 1, title: 'Design Database Schema', status: 'completed', priority: 'high', progress_percentage: 100, project_name: 'Debo Task Management System' },
  { id: 2, title: 'Implement Authentication API', status: 'completed', priority: 'high', progress_percentage: 100, project_name: 'Debo Task Management System' },
  { id: 3, title: 'Create React Components', status: 'in_progress', priority: 'high', progress_percentage: 60, project_name: 'Debo Task Management System' }
];

const teams = [
  { id: 1, name: 'Backend Team', team_type: 'backend', member_count: 3, completion_rate: 60 },
  { id: 2, name: 'Frontend Team', team_type: 'frontend_web', member_count: 2, completion_rate: 33 }
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

// Login
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

// Register
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
app.get('/api/projects/:id', auth, (req, res) => {
  const project = projects.find(p => p.id === parseInt(req.params.id));
  res.json(project || {});
});

// Tasks
app.get('/api/tasks', auth, (req, res) => res.json(tasks));
app.get('/api/tasks/:id', auth, (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  res.json(task || {});
});
app.patch('/api/tasks/:id/status', auth, (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (task) {
    if (req.body.status) task.status = req.body.status;
    if (req.body.progress_percentage !== undefined) task.progress_percentage = req.body.progress_percentage;
    res.json({ success: true, task });
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// Teams
app.get('/api/teams', auth, (req, res) => res.json(teams));

// Reports
app.get('/api/reports/project-summary', auth, (req, res) => {
  res.json(projects.map(p => ({ ...p, project_name: p.name, progress_percentage: p.progress })));
});
app.get('/api/reports/team-performance', auth, (req, res) => res.json(teams));
app.get('/api/reports/user-productivity', auth, (req, res) => {
  res.json({ total_tasks_assigned: 5, tasks_completed: 3, completion_rate: 60, overdue_tasks: 1 });
});
app.get('/api/reports/task-summary', auth, (req, res) => {
  res.json([{ status: 'completed', task_count: 2 }, { status: 'in_progress', task_count: 1 }, { status: 'pending', task_count: 2 }]);
});
app.get('/api/reports/export/projects', auth, (req, res) => {
  res.json({ data: projects.map(p => ({ 'Project Name': p.name, 'Status': p.status, 'Progress %': p.progress })) });
});

// Users
app.get('/api/users', auth, (req, res) => {
  res.json(users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role })));
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
});