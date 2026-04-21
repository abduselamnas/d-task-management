const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            message: 'Access denied. No token provided.',
            code: 'NO_TOKEN'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }
        res.status(401).json({ 
            message: 'Authentication failed.',
            code: 'AUTH_FAILED'
        });
    }
};

// Role-based access control middleware
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                userRole: req.user.role
            });
        }
        
        next();
    };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Check if user is admin or project manager
const isManager = (req, res, next) => {
    if (!['admin', 'project_manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Manager access required' });
    }
    next();
};

module.exports = { auth, checkRole, isAdmin, isManager };