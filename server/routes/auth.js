const router = require('express').Router();
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');

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

        const existing = User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const user = User.create({ name, email, password, role: 'customer' });
        const token = signToken(user.id);
        res.status(201).json({ token, user });
    } catch (err) {
        console.error('Register error:', err);
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

        const user = User.findByEmail(email);
        if (!user || !User.comparePassword(user, password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = signToken(user.id);
        res.json({ token, user, role: user.role });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me — get current user
router.get('/me', protect, (req, res) => {
    res.json({ user: req.user });
});

// PUT /api/auth/address — add/update address
router.put('/address', protect, async (req, res) => {
    res.json({ message: 'Address saved', addresses: [] });
});

module.exports = router;