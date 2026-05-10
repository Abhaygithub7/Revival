const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// POST /api/orders — place an order
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { items, customer, shipping, payment } = req.body;
        if (!items || !items.length || !customer?.name || !customer?.email) {
            return res.status(400).json({ error: 'Items and customer info are required' });
        }

        // Validate stock and compute totals
        let subtotal = 0;
        const resolvedItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
            if (product.stock < item.qty) {
                return res.status(400).json({ error: `Insufficient stock for "${product.name}"` });
            }
            subtotal += product.price * item.qty;
            resolvedItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                qty: item.qty,
            });
        }

        // Decrement stock atomically
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
        }

        const tax = Math.round(subtotal * 0.085 * 100) / 100;
        const shippingCost = subtotal >= 100 ? 0 : 8.99;
        const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;

        const order = await Order.create({
            user: req.user?._id || null,
            customerName: customer.name,
            customerEmail: customer.email.toLowerCase(),
            items: resolvedItems,
            subtotal, tax, shippingCost, total,
            shippingAddress: shipping,
            payment: { method: payment?.method, last4: payment?.last4 },
        });

        res.status(201).json({ order });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// GET /api/orders — list orders (customer: own | admin: all)
router.get('/', protect, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin') {
            filter.customerEmail = req.user.email;
        }
        const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
        res.json({ orders, count: orders.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.id }).lean();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        // Customers can only see their own orders
        if (req.user.role !== 'admin' && order.customerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PATCH /api/orders/:id/status — admin update status
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!valid.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be: ${valid.join(', ')}` });
        }
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.id },
            { status },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // If cancelled, restore stock
        if (status === 'cancelled') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
            }
        }

        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
