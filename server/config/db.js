const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

// In-memory data store (works on Vercel)
const db = {
    users: [],
    products: [],
    orders: [],
    settings: { storeName: 'Revival Thrift Store', currency: 'USD', taxRate: 0.085 }
};

function initDB() {
    // Try to load from file system if exists (for local dev)
    try {
        const fs = require('fs');
        if (fs.existsSync(DB_PATH)) {
            console.log('✓ Database file found (local dev)');
        } else {
            console.log('✓ Using in-memory database (Vercel)');
        }
    } catch (err) {
        console.log('✓ Using in-memory database');
    }

    // Seed some sample products if empty
    if (db.products.length === 0) {
        const sampleProducts = [
            { name: 'Vintage Denim Jacket', price: 89.99, originalPrice: 120, category: 'outerwear', era: '90s', condition: 'Good', size: 'L', stock: 3, image: 'images/vintage_denim_jacket.png', status: 'active' },
            { name: 'Retro Wool Sweater', price: 45.00, originalPrice: 65, category: 'knitwear', era: '80s', condition: 'Excellent', size: 'M', stock: 5, image: 'images/retro_wool_sweater.png', status: 'active' },
            { name: 'Classic Leather Boots', price: 125.00, originalPrice: 180, category: 'footwear', era: '2000s', condition: 'Good', size: '10', stock: 2, image: 'images/classic_leather_boots.png', status: 'active' },
            { name: 'Vintage Scarf', price: 25.00, category: 'accessories', era: '70s', condition: 'Excellent', size: 'One Size', stock: 8, image: 'images/vintage_scarf.png', status: 'active' },
            { name: 'Retro Lamp', price: 55.00, originalPrice: 80, category: 'home', era: '60s', condition: 'Good', size: 'Medium', stock: 3, image: 'images/retro_lamp.png', status: 'active' },
        ];

        sampleProducts.forEach((p, i) => {
            p.id = i + 1;
            db.products.push(p);
        });
        console.log('✓ Sample products seeded');
    }

    return Promise.resolve(db);
}

function getDB() {
    return db;
}

function saveDB() {
    // For in-memory, data persists during function execution
    // For local dev, could save to file here
}

function closeDB() {
    // No-op for in-memory
}

module.exports = { initDB, getDB, saveDB, closeDB };