const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Simple login - accepts any credentials for testing
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email and password are required' 
    });
  }
  
  // Determine role based on email
  let role = 'team_member';
  if (email.includes('admin')) {
    role = 'admin';
  } else if (email.includes('manager')) {
    role = 'project_manager';
  }
  
  // Create user object
  const user = {
    id: 1,
    email: email,
    full_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    role: role,
    team_id: null
  };
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    'secretkey123',
    { expiresIn: '7d' }
  );
  
  console.log('Login successful, returning token');
  
  res.json({
    success: true,
    token: token,
    user: user
  });
});

module.exports = router;