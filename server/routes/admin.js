const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', (req, res) => {
    try {
        const stats = Order.getStats();
        stats.pendingOrders = Order.getPendingCount();
        stats.activeProducts = Product.findAll({ all: true }).filter(p => p.status === 'active' && p.stock > 0).length;
        stats.customers = 0; // Would need user count query

        const recentOrders = Order.getRecent(5);
        res.json({ stats, recentOrders, monthlyRevenue: [] });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

router.get('/customers', (req, res) => {
    // Simplified - would need additional User model methods
    res.json({ customers: [] });
});

router.get('/settings', (req, res) => {
    try {
        const settings = Settings.get();
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/settings', (req, res) => {
    try {
        const allowedFields = ['storeName', 'storeEmail', 'storePhone', 'storeAddress', 'currency', 'taxRate'];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const settings = Settings.update(updates);
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;