const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret_key', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

async function protect(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
        const user = User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

async function optionalAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (header && header.startsWith('Bearer ')) {
            const token = header.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
            req.user = User.findById(decoded.id);
        }
    } catch { /* ignore invalid tokens */ }
    next();
}

module.exports = { protect, adminOnly, optionalAuth, signToken };