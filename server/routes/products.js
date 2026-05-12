const router = require('express').Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products — public storefront listing
router.get('/', (req, res) => {
    try {
        const { category, search, all } = req.query;
        const products = Product.findAll({ category, search, all: all === 'true' });
        res.json({ products, count: products.length });
    } catch (err) {
        console.error('Products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
    try {
        const categories = Product.getCategories();
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
    try {
        const product = Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/products — admin create
router.post('/', protect, adminOnly, (req, res) => {
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

        const product = Product.create(req.body);
        res.status(201).json({ product });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(400).json({ error: err.message || 'Failed to create product' });
    }
});

// PUT /api/products/:id — admin update
router.put('/:id', protect, adminOnly, (req, res) => {
    try {
        const product = Product.update(req.params.id, req.body);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    } catch (err) {
        res.status(400).json({ error: err.message || 'Failed to update product' });
    }
});

// DELETE /api/products/:id — admin delete
router.delete('/:id', protect, adminOnly, (req, res) => {
    try {
        Product.delete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;