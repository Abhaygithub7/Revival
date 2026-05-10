const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', async (req, res) => {
    try {
        const [rev] = await Order.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: '$total' }, orderCount: { $sum: 1 }, avgOrderValue: { $avg: '$total' }, totalItems: { $sum: { $sum: '$items.qty' } } } },
        ]);
        const pendingCount = await Order.countDocuments({ status: { $in: ['pending', 'processing'] } });
        const activeProducts = await Product.countDocuments({ status: 'active', stock: { $gt: 0 } });
        const customerCount = await User.countDocuments({ role: 'customer' });
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
        const monthlyRevenue = await Order.aggregate([
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }, { $limit: 12 },
        ]);
        res.json({ stats: { revenue: rev?.totalRevenue||0, orders: rev?.orderCount||0, avgOrderValue: Math.round(rev?.avgOrderValue||0), itemsSold: rev?.totalItems||0, pendingOrders: pendingCount, activeProducts, customers: customerCount }, recentOrders, monthlyRevenue });
    } catch (err) { res.status(500).json({ error: 'Failed to load dashboard' }); }
});

router.get('/customers', async (req, res) => {
    try {
        const users = await User.find({ role: 'customer' }).select('-password').lean();
        const stats = await Order.aggregate([
            { $group: { _id: '$customerEmail', totalSpent: { $sum: '$total' }, orderCount: { $sum: 1 }, lastOrder: { $max: '$createdAt' }, name: { $last: '$customerName' } } },
        ]);
        const map = {};
        users.forEach(u => { map[u.email] = { name: u.name, email: u.email, orders: 0, totalSpent: 0, lastOrder: null, registered: true, joinDate: u.createdAt }; });
        stats.forEach(s => { if (map[s._id]) { Object.assign(map[s._id], { orders: s.orderCount, totalSpent: s.totalSpent, lastOrder: s.lastOrder }); } else { map[s._id] = { name: s.name, email: s._id, orders: s.orderCount, totalSpent: s.totalSpent, lastOrder: s.lastOrder, registered: false }; } });
        res.json({ customers: Object.values(map).sort((a,b) => b.totalSpent - a.totalSpent) });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch customers' }); }
});

router.get('/settings', async (req, res) => {
    let s = await Settings.findOne(); if (!s) s = await Settings.create({});
    res.json({ settings: s });
});

router.put('/settings', async (req, res) => {
    let s = await Settings.findOne(); if (!s) s = new Settings();
    Object.assign(s, req.body); await s.save();
    res.json({ settings: s });
});

module.exports = router;
