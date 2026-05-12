const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/cart — get logged-in user's cart
router.get('/', protect, (req, res) => {
    const items = User.getCart(req.user.id);
    res.json({ items });
});

// PUT /api/cart — replace cart
router.put('/', protect, (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid cart format' });
    }

    const validItems = items.filter(item =>
        item &&
        item.productId &&
        typeof item.qty === 'number' &&
        item.qty > 0 &&
        item.qty <= 99
    ).map(item => ({
        productId: item.productId,
        qty: Math.min(Math.floor(item.qty), 99)
    }));

    User.updateCart(req.user.id, validItems);
    res.json({ message: 'Cart updated', items: validItems });
});

// POST /api/cart/merge — merge guest cart into user cart on login
router.post('/merge', protect, (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length) {
        return res.json({ message: 'Nothing to merge' });
    }

    const existingCart = User.getCart(req.user.id);
    const merged = [...existingCart];

    for (const incoming of items) {
        if (!incoming?.productId || typeof incoming?.qty !== 'number' || incoming.qty <= 0) {
            continue;
        }
        const existing = merged.find(c => c.productId === incoming.productId);
        if (existing) {
            existing.qty = Math.min(existing.qty + incoming.qty, 99);
        } else {
            merged.push({ productId: incoming.productId, qty: Math.min(incoming.qty, 99) });
        }
    }

    User.updateCart(req.user.id, merged);
    res.json({ message: 'Cart merged', cart: merged });
});

// GET /api/wishlist
router.get('/wishlist', protect, (req, res) => {
    const items = User.getWishlist(req.user.id);
    res.json({ items });
});

// PUT /api/wishlist
router.put('/wishlist', protect, (req, res) => {
    const { productIds } = req.body;
    // This would need additional implementation
    res.json({ message: 'Wishlist updated', wishlist: [] });
});

// POST /api/wishlist/toggle
router.post('/wishlist/toggle', protect, (req, res) => {
    const { productId } = req.body;
    const added = User.toggleWishlist(req.user.id, productId);
    res.json({ added });
});

module.exports = router;