const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// CORS - Allow all for testing
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.json());

// Mock users database
const users = [
    {
        id: 1,
        email: 'admin@debo.com',
        password: 'Admin@123',
        full_name: 'Admin User',
        role: 'admin',
        team_id: null
    },
    {
        id: 2,
        email: 'manager@debo.com',
        password: 'Admin@123',
        full_name: 'Manager User',
        role: 'project_manager',
        team_id: null
    },
    {
        id: 3,
        email: 'team@debo.com',
        password: 'Admin@123',
        full_name: 'Team Member',
        role: 'team_member',
        team_id: 1
    },
    {
        id: 4,
        email: 'sarah@debo.com',
        password: 'Admin@123',
        full_name: 'Sarah Chen',
        role: 'team_member',
        team_id: 1
    },
    {
        id: 5,
        email: 'mike@debo.com',
        password: 'Admin@123',
        full_name: 'Mike Johnson',
        role: 'team_member',
        team_id: 2
    }
];

// Mock teams database
const teams = [
    {
        id: 1,
        name: 'Backend Development Team',
        description: 'Responsible for server-side logic and APIs',
        team_type: 'backend',
        created_by: 1,
        member_count: 2,
        project_count: 3
    },
    {
        id: 2,
        name: 'Frontend Web Development Team',
        description: 'Responsible for web interfaces using React',
        team_type: 'frontend_web',
        created_by: 1,
        member_count: 1,
        project_count: 2
    },
    {
        id: 3,
        name: 'Mobile Application Development Team',
        description: 'Responsible for mobile app development',
        team_type: 'mobile',
        created_by: 1,
        member_count: 0,
        project_count: 1
    },
    {
        id: 4,
        name: 'UI/UX Design Team',
        description: 'Responsible for user interface and experience design',
        team_type: 'ui_ux',
        created_by: 1,
        member_count: 0,
        project_count: 1
    }
];

// Mock projects database
const projects = [
    {
        id: 1,
        name: 'Debo Task Management System',
        description: 'Complete project and task management system',
        status: 'active',
        priority: 'high',
        progress: 75,
        total_tasks: 10,
        completed_tasks: 7,
        manager_name: 'Admin User',
        team_name: 'Backend Development Team',
        start_date: '2026-01-01',
        end_date: '2026-03-31'
    },
    {
        id: 2,
        name: 'Mobile App Development',
        description: 'React Native mobile application',
        status: 'planning',
        priority: 'medium',
        progress: 30,
        total_tasks: 8,
        completed_tasks: 2,
        manager_name: 'Manager User',
        team_name: 'Mobile Application Development Team',
        start_date: '2026-01-15',
        end_date: '2026-04-30'
    }
];

// Mock tasks database
const tasks = [
    {
        id: 1,
        title: 'Design Database Schema',
        description: 'Create MySQL database schema',
        status: 'completed',
        priority: 'high',
        progress_percentage: 100,
        project_name: 'Debo Task Management System',
        assignee_name: 'Sarah Chen',
        due_date: '2026-01-15'
    },
    {
        id: 2,
        title: 'Implement Authentication API',
        description: 'Create JWT-based authentication',
        status: 'completed',
        priority: 'high',
        progress_percentage: 100,
        project_name: 'Debo Task Management System',
        assignee_name: 'Mike Johnson',
        due_date: '2026-01-20'
    },
    {
        id: 3,
        title: 'Create React Components',
        description: 'Build reusable React components',
        status: 'in_progress',
        priority: 'high',
        progress_percentage: 60,
        project_name: 'Debo Task Management System',
        assignee_name: 'Team Member',
        due_date: '2026-02-10'
    }
];

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
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
            role: user.role,
            team_id: user.team_id
        }
    });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, role = 'team_member' } = req.body;
  
  console.log('Registration attempt:', { email, full_name, role });
  
  // Validate required fields
  if (!email || !password || !full_name) {
    return res.status(400).json({ 
      message: 'All fields are required' 
    });
  }
  
  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters' 
    });
  }
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ 
      message: 'User with this email already exists' 
    });
  }
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    email,
    password, // In production, you would hash this!
    full_name,
    role: role === 'admin' ? 'team_member' : role, // Prevent self-registration as admin
    team_id: null
  };
  
  users.push(newUser);
  
  console.log('User created:', newUser);
  
  // Create token for auto-login
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
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
      role: newUser.role,
      team_id: newUser.team_id
    }
  });
});

// Verify token middleware
const verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, 'secretkey123');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// USERS ROUTES
app.get('/api/users', verifyToken, (req, res) => {
    // Only admin and managers can see all users
    if (req.user.role === 'admin' || req.user.role === 'project_manager') {
        const usersList = users.map(u => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            role: u.role,
            team_id: u.team_id
        }));
        res.json(usersList);
    } else {
        // Team members can only see themselves
        const user = users.find(u => u.id === req.user.id);
        res.json([{
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            team_id: user.team_id
        }]);
    }
});

app.get('/api/users/:id', verifyToken, (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        team_id: user.team_id
    });
});

// TEAMS ROUTES
app.get('/api/teams', verifyToken, (req, res) => {
    res.json(teams);
});

app.get('/api/teams/:id', verifyToken, (req, res) => {
    const team = teams.find(t => t.id === parseInt(req.params.id));
    if (!team) {
        return res.status(404).json({ message: 'Team not found' });
    }
    
    // Get team members
    const teamMembers = users.filter(u => u.team_id === team.id);
    
    res.json({
        ...team,
        members: teamMembers
    });
});

app.post('/api/teams', verifyToken, (req, res) => {
    const { name, description, team_type } = req.body;
    const newTeam = {
        id: teams.length + 1,
        name,
        description,
        team_type,
        created_by: req.user.id,
        member_count: 0,
        project_count: 0
    };
    teams.push(newTeam);
    res.status(201).json(newTeam);
});

app.put('/api/teams/:id', verifyToken, (req, res) => {
    const teamId = parseInt(req.params.id);
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) {
        return res.status(404).json({ message: 'Team not found' });
    }
    teams[teamIndex] = { ...teams[teamIndex], ...req.body };
    res.json(teams[teamIndex]);
});

app.delete('/api/teams/:id', verifyToken, (req, res) => {
    const teamId = parseInt(req.params.id);
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) {
        return res.status(404).json({ message: 'Team not found' });
    }
    teams.splice(teamIndex, 1);
    res.json({ message: 'Team deleted successfully' });
});

app.get('/api/teams/:id/members', verifyToken, (req, res) => {
    const teamId = parseInt(req.params.id);
    const teamMembers = users.filter(u => u.team_id === teamId);
    res.json(teamMembers);
});

app.post('/api/teams/:id/members', verifyToken, (req, res) => {
    const { user_id } = req.body;
    const userIndex = users.findIndex(u => u.id === user_id);
    if (userIndex !== -1) {
        users[userIndex].team_id = parseInt(req.params.id);
    }
    res.json({ message: 'Member added successfully' });
});

app.delete('/api/teams/:id/members/:user_id', verifyToken, (req, res) => {
    const userId = parseInt(req.params.user_id);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].team_id = null;
    }
    res.json({ message: 'Member removed successfully' });
});

// PROJECTS ROUTES
app.get('/api/projects', verifyToken, (req, res) => {
    res.json(projects);
});

app.get('/api/projects/:id', verifyToken, (req, res) => {
    const project = projects.find(p => p.id === parseInt(req.params.id));
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
});

app.post('/api/projects', verifyToken, (req, res) => {
    const newProject = {
        id: projects.length + 1,
        ...req.body,
        progress: 0,
        total_tasks: 0,
        completed_tasks: 0
    };
    projects.push(newProject);
    res.status(201).json(newProject);
});

app.put('/api/projects/:id', verifyToken, (req, res) => {
    const projectId = parseInt(req.params.id);
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ message: 'Project not found' });
    }
    projects[projectIndex] = { ...projects[projectIndex], ...req.body };
    res.json(projects[projectIndex]);
});

app.delete('/api/projects/:id', verifyToken, (req, res) => {
    const projectId = parseInt(req.params.id);
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ message: 'Project not found' });
    }
    projects.splice(projectIndex, 1);
    res.json({ message: 'Project deleted successfully' });
});

// TASKS ROUTES
app.get('/api/tasks', verifyToken, (req, res) => {
    res.json(tasks);
});

app.get('/api/tasks/:id', verifyToken, (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
});

app.post('/api/tasks', verifyToken, (req, res) => {
    const newTask = {
        id: tasks.length + 1,
        ...req.body,
        progress_percentage: 0
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.patch('/api/tasks/:id/status', verifyToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }
    tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
    res.json(tasks[taskIndex]);
});

app.put('/api/tasks/:id', verifyToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }
    tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
    res.json(tasks[taskIndex]);
});

app.delete('/api/tasks/:id', verifyToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }
    tasks.splice(taskIndex, 1);
    res.json({ message: 'Task deleted successfully' });
});

app.post('/api/tasks/:id/comments', verifyToken, (req, res) => {
    res.status(201).json({ message: 'Comment added successfully' });
});

app.get('/api/tasks/:id/comments', verifyToken, (req, res) => {
    res.json([]);
});

// REPORTS ROUTES
app.get('/api/reports/project-summary', verifyToken, (req, res) => {
    res.json(projects.map(p => ({
        ...p,
        completion_rate: p.total_tasks > 0 ? (p.completed_tasks / p.total_tasks * 100).toFixed(1) : 0
    })));
});

app.get('/api/reports/team-performance', verifyToken, (req, res) => {
    res.json(teams);
});

app.get('/api/reports/user-productivity', verifyToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    res.json({
        total_tasks_assigned: 5,
        tasks_completed: 3,
        completion_rate: 60,
        overdue_tasks: 1
    });
});

app.get('/api/reports/task-summary', verifyToken, (req, res) => {
    res.json([
        { status: 'completed', priority: 'high', task_count: 2 },
        { status: 'in_progress', priority: 'high', task_count: 1 },
        { status: 'pending', priority: 'medium', task_count: 2 }
    ]);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Test login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /api/users`);
    console.log(`   GET  /api/teams`);
    console.log(`   GET  /api/projects`);
    console.log(`   GET  /api/tasks`);
});