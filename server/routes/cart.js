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
    req.user.cart = items || [];
    await req.user.save();
    res.json({ message: 'Cart updated', items: req.user.cart });
});

// POST /api/cart/merge — merge guest cart into user cart on login
router.post('/merge', protect, async (req, res) => {
    const { items } = req.body; // [{productId, qty}]
    if (!items?.length) return res.json({ message: 'Nothing to merge' });
    const user = await User.findById(req.user._id);
    for (const incoming of items) {
        const existing = user.cart.find(c => c.productId?.toString() === incoming.productId);
        if (existing) {
            existing.qty += incoming.qty;
        } else {
            user.cart.push({ productId: incoming.productId, qty: incoming.qty });
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
