const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ message: 'No token found in Authorization header' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { uid, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}

// Default export remains the auth middleware for backward-compat
module.exports = requireAuth;
// Named exports for advanced use
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
