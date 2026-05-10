const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

function signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const user = await User.create({ name, email: email.toLowerCase(), password, role: 'customer' });
        const token = signToken(user._id);
        res.status(201).json({ token, user });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = signToken(user._id);
        res.json({ token, user, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me — get current user
router.get('/me', protect, (req, res) => {
    res.json({ user: req.user });
});

// PUT /api/auth/address — add/update address
router.put('/address', protect, async (req, res) => {
    try {
        req.user.addresses.push(req.body);
        await req.user.save();
        res.json({ addresses: req.user.addresses });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save address' });
    }
});

module.exports = router;
