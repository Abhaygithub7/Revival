const bcrypt = require('bcryptjs');
const { getDB, saveDB } = require('../config/db');

const User = {
    async create({ name, email, password, role = 'customer' }) {
        const db = getDB();
        const hashedPassword = await bcrypt.hash(password, 12);
        const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
        stmt.run([name, email.toLowerCase(), hashedPassword, role]);
        saveDB();

        const result = db.exec('SELECT last_insert_rowid() as id');
        const id = result[0].values[0][0];
        return this.findById(id);
    },

    findById(id) {
        const db = getDB();
        const result = db.exec('SELECT * FROM users WHERE id = ?', [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this._mapRow(result[0].columns, result[0].values[0]);
    },

    findByEmail(email) {
        const db = getDB();
        const result = db.exec('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this._mapRow(result[0].columns, result[0].values[0]);
    },

    async comparePassword(user, password) {
        return bcrypt.compare(password, user.password);
    },

    getCart(userId) {
        const db = getDB();
        const result = db.exec(`
            SELECT ci.*, p.name, p.price, p.image, p.era, p.size
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
        `, [userId]);
        if (result.length === 0) return [];
        return result[0].values.map(row => this._mapCartRow(result[0].columns, row));
    },

    async updateCart(userId, items) {
        const db = getDB();
        db.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        for (const item of items) {
            db.run('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)', [userId, item.productId, item.qty]);
        }
        saveDB();
    },

    getWishlist(userId) {
        const db = getDB();
        const result = db.exec(`
            SELECT p.* FROM wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ?
        `, [userId]);
        if (result.length === 0) return [];
        return result[0].values.map(row => this._mapProductRow(result[0].columns, row));
    },

    async toggleWishlist(userId, productId) {
        const db = getDB();
        const exists = db.exec('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
        if (exists[0]?.values.length > 0) {
            db.run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
            return false;
        } else {
            db.run('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
            return true;
        }
        saveDB();
    },

    _mapRow(columns, row) {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        delete obj.password;
        return obj;
    },

    _mapCartRow(columns, row) {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return { id: obj.product_id, name: obj.name, price: obj.price, image: obj.image, era: obj.era, size: obj.size, qty: obj.qty };
    },

    _mapProductRow(columns, row) {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
    }
};

module.exports = User;