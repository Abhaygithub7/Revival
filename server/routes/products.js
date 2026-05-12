const router = require('express').Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products — public storefront listing
router.get('/', async (req, res) => {
    try {
        const { category, search, all } = req.query;
        let filter = {};

        // Admin can see all; storefront only sees active+in-stock
        if (all !== 'true') {
            filter.status = 'active';
            filter.stock = { $gt: 0 };
        }

        if (category && category !== 'all') {
            filter.category = category.toLowerCase();
        }

        let products;
        if (search) {
            filter.$text = { $search: search };
            products = await Product.find(filter).sort({ score: { $meta: 'textScore' } }).lean();
        } else {
            products = await Product.find(filter).sort({ createdAt: -1 }).lean();
        }

        res.json({ products, count: products.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/categories — unique category list
router.get('/categories', async (req, res) => {
    try {
        const cats = await Product.distinct('category', { status: 'active', stock: { $gt: 0 } });
        res.json({ categories: ['all', ...cats] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/products — admin create
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { name, price, category } = req.body;
        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }
        if (price < 0) {
            return res.status(400).json({ error: 'Price must be positive' });
        }
        const validCategories = ['outerwear', 'accessories', 'knitwear', 'footwear', 'home'];
        if (!validCategories.includes(category.toLowerCase())) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
        }
        const product = await Product.create(req.body);
        res.status(201).json({ product });
    } catch (err) {
        res.status(400).json({ error: err.message || 'Failed to create product' });
    }
});

// PUT /api/products/:id — admin update
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    } catch (err) {
        res.status(400).json({ error: err.message || 'Failed to update product' });
    }
});

// DELETE /api/products/:id — admin delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
