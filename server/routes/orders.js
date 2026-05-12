const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// POST /api/orders — place an order
router.post('/', optionalAuth, (req, res) => {
    try {
        const { items, customer, shipping, payment } = req.body;
        if (!items || !items.length || !customer?.name || !customer?.email) {
            return res.status(400).json({ error: 'Items and customer info are required' });
        }

        // Validate stock and compute totals
        let subtotal = 0;
        const resolvedItems = [];

        for (const item of items) {
            const product = Product.findById(item.productId);
            if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
            if (product.stock < item.qty) {
                return res.status(400).json({ error: `Insufficient stock for "${product.name}"` });
            }
            subtotal += product.price * item.qty;
            resolvedItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                qty: item.qty,
            });

            // Decrement stock
            Product.updateStock(item.productId, -item.qty);
        }

        const tax = Math.round(subtotal * 0.085 * 100) / 100;
        const shippingCost = subtotal >= 100 ? 0 : 8.99;
        const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;

        const order = Order.create({
            userId: req.user?.id || null,
            customerName: customer.name,
            customerEmail: customer.email.toLowerCase(),
            items: resolvedItems,
            subtotal, tax, shippingCost, total,
            shippingAddress: shipping,
            paymentMethod: payment?.method,
            paymentLast4: payment?.last4,
        });

        res.status(201).json({ order });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// GET /api/orders — list orders
router.get('/', protect, (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const orders = Order.findAll({ email: req.user.email, all: isAdmin });
        res.json({ orders, count: orders.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id
router.get('/:id', protect, (req, res) => {
    try {
        const order = Order.findByOrderId(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && order.customerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PATCH /api/orders/:id/status — admin update status
router.patch('/:id/status', protect, adminOnly, (req, res) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!valid.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be: ${valid.join(', ')}` });
        }

        const order = Order.updateStatus(req.params.id, status);

        // If cancelled, restore stock
        if (status === 'cancelled') {
            for (const item of order.items) {
                Product.updateStock(item.productId, item.qty);
            }
        }

        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;