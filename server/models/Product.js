const { getDB } = require('../config/db');

const Product = {
    create(data) {
        const db = getDB();
        const product = {
            id: db.products.length + 1,
            name: data.name,
            price: data.price,
            originalPrice: data.originalPrice || null,
            category: data.category,
            era: data.era || null,
            condition: data.condition || 'Good',
            size: data.size || null,
            stock: data.stock || 1,
            status: data.status || 'active',
            description: data.description || '',
            image: data.image || 'images/vintage_denim_jacket.png',
            badge: data.badge || null,
            badgeColor: data.badgeColor || null,
            createdAt: new Date().toISOString()
        };
        db.products.push(product);
        return product;
    },

    findById(id) {
        const db = getDB();
        return db.products.find(p => p.id === parseInt(id));
    },

    findAll({ category, search, all } = {}) {
        let products = [...db.products];

        if (!all) {
            products = products.filter(p => p.status === 'active' && p.stock > 0);
        }

        if (category && category !== 'all') {
            products = products.filter(p => p.category === category.toLowerCase());
        }

        if (search) {
            const s = search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(s) ||
                (p.description && p.description.toLowerCase().includes(s)) ||
                (p.category && p.category.toLowerCase().includes(s)) ||
                (p.era && p.era.toLowerCase().includes(s))
            );
        }

        return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    update(id, data) {
        const db = getDB();
        const idx = db.products.findIndex(p => p.id === parseInt(id));
        if (idx === -1) return null;

        const product = db.products[idx];
        const updated = { ...product, ...data };
        db.products[idx] = updated;
        return updated;
    },

    delete(id) {
        const db = getDB();
        const idx = db.products.findIndex(p => p.id === parseInt(id));
        if (idx > -1) {
            db.products.splice(idx, 1);
        }
    },

    getCategories() {
        const db = getDB();
        const categories = [...new Set(
            db.products
                .filter(p => p.status === 'active' && p.stock > 0)
                .map(p => p.category)
        )];
        return ['all', ...categories];
    },

    updateStock(id, qty) {
        const db = getDB();
        const product = db.products.find(p => p.id === parseInt(id));
        if (product) {
            product.stock = Math.max(0, product.stock + qty);
        }
    }
};

module.exports = Product;