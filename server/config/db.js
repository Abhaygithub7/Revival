const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

let db = null;

async function initDB() {
    const SQL = await initSqlJs();

    // Load existing DB or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('✓ SQLite database loaded');
    } else {
        db = new SQL.Database();
        console.log('✓ New SQLite database created');
    }

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            country TEXT DEFAULT 'United States',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            original_price REAL,
            category TEXT NOT NULL,
            era TEXT,
            condition TEXT DEFAULT 'Good',
            size TEXT,
            stock INTEGER DEFAULT 1,
            status TEXT DEFAULT 'active',
            description TEXT DEFAULT '',
            details TEXT,
            image TEXT DEFAULT 'images/vintage_denim_jacket.png',
            badge TEXT,
            badge_color TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE,
            user_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL,
            tax REAL NOT NULL,
            shipping_cost REAL NOT NULL,
            total REAL NOT NULL,
            shipping_address TEXT,
            payment_method TEXT,
            payment_last4 TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            qty INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_name TEXT,
            store_email TEXT,
            store_phone TEXT,
            store_address TEXT,
            currency TEXT DEFAULT 'USD',
            tax_rate REAL DEFAULT 0.085
        )
    `);

    // Insert default settings if not exists
    const settings = db.exec("SELECT * FROM settings LIMIT 1");
    if (settings.length === 0) {
        db.run("INSERT INTO settings (store_name, currency, tax_rate) VALUES ('Revival Thrift Store', 'USD', 0.085)");
    }

    saveDB();
    console.log('✓ Database tables initialized');

    return db;
}

function saveDB() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }
}

function getDB() {
    return db;
}

function closeDB() {
    if (db) {
        saveDB();
        db.close();
        db = null;
    }
}

module.exports = { initDB, getDB, saveDB, closeDB };