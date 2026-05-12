require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDB, getDB, saveDB } = require('./config/db');

const app = express();

// Initialize SQLite database synchronously for Vercel
let db;
try {
    // Try to get sync version - sql.js needs to be initialized
    initDB().then(database => {
        db = database;
        console.log('✓ Database initialized');
    }).catch(err => {
        console.error('✗ Database init error:', err);
    });
} catch (err) {
    console.error('✗ Database init failed:', err);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Make db available to routes
app.use((req, res, next) => {
    req.db = getDB();
    next();
});

// Rate limiting for auth routes
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many requests, try again later' } }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// SPA fallback
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Save DB on exit
process.on('beforeExit', () => {
    saveDB();
});

// Export for Vercel
module.exports = app;