const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Attach decoded payload to req.user
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token. Authorization denied.' })
        }
    } else {
        return res.status(401).json({ message: 'No token provided. Authorization denied.' })
    }
};

// Middleware to authorize roles
exports.authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: `Access denied for role: ${req.user.role}` })
    }
    next();
};
