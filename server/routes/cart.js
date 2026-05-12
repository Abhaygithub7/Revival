const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/cart — get logged-in user's cart
router.get('/', protect, async (req, res) => {
    const user = await User.findById(req.user._id).populate('cart.productId').lean();
    const items = (user.cart || []).filter(i => i.productId).map(i => ({
        id: i.productId._id,
        name: i.productId.name,
        price: i.productId.price,
        image: i.productId.image,
        era: i.productId.era,
        size: i.productId.size,
        qty: i.qty,
    }));
    res.json({ items });
});

// PUT /api/cart — replace cart
router.put('/', protect, async (req, res) => {
    const { items } = req.body; // [{productId, qty}]

    // Validate items structure
    if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid cart format' });
    }

    // Validate each item has required fields and valid values
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

    req.user.cart = validItems;
    await req.user.save();
    res.json({ message: 'Cart updated', items: req.user.cart });
});

// POST /api/cart/merge — merge guest cart into user cart on login
router.post('/merge', protect, async (req, res) => {
    const { items } = req.body; // [{productId, qty}]

    if (!Array.isArray(items) || !items.length) {
        return res.json({ message: 'Nothing to merge' });
    }

    const user = await User.findById(req.user._id);

    for (const incoming of items) {
        if (!incoming?.productId || typeof incoming?.qty !== 'number' || incoming.qty <= 0) {
            continue; // Skip invalid items
        }
        const existing = user.cart.find(c => c.productId?.toString() === incoming.productId);
        if (existing) {
            existing.qty = Math.min(existing.qty + incoming.qty, 99);
        } else {
            user.cart.push({ productId: incoming.productId, qty: Math.min(incoming.qty, 99) });
        }
    }
    await user.save();
    res.json({ message: 'Cart merged', cart: user.cart });
});

// GET /api/wishlist
router.get('/wishlist', protect, async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist').lean();
    res.json({ items: user.wishlist || [] });
});

// PUT /api/wishlist
router.put('/wishlist', protect, async (req, res) => {
    const { productIds } = req.body;
    req.user.wishlist = productIds || [];
    await req.user.save();
    res.json({ message: 'Wishlist updated', wishlist: req.user.wishlist });
});

// POST /api/wishlist/toggle
router.post('/wishlist/toggle', protect, async (req, res) => {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.indexOf(productId);
    if (idx === -1) {
        user.wishlist.push(productId);
    } else {
        user.wishlist.splice(idx, 1);
    }
    await user.save();
    res.json({ wishlist: user.wishlist, added: idx === -1 });
});

module.exports = router;
