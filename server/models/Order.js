const { getDB, saveDB } = require('../config/db');

const Order = {
    generateOrderId() {
        return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    },

    create(data) {
        const db = getDB();
        const orderId = this.generateOrderId();
        const stmt = db.prepare(`
            INSERT INTO orders (order_id, user_id, customer_name, customer_email, items, subtotal, tax, shipping_cost, total, shipping_address, payment_method, payment_last4, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([
            orderId, data.userId || null, data.customerName, data.customerEmail,
            JSON.stringify(data.items), data.subtotal, data.tax, data.shippingCost,
            data.total, JSON.stringify(data.shippingAddress), data.paymentMethod,
            data.paymentLast4, 'pending'
        ]);
        saveDB();
        return this.findByOrderId(orderId);
    },

    findById(id) {
        const db = getDB();
        const result = db.exec('SELECT * FROM orders WHERE id = ?', [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this._mapRow(result[0].columns, result[0].values[0]);
    },

    findByOrderId(orderId) {
        const db = getDB();
        const result = db.exec('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this._mapRow(result[0].columns, result[0].values[0]);
    },

    findAll({ email, all = false } = {}) {
        const db = getDB();
        let sql = 'SELECT * FROM orders';
        const params = [];
        if (!all) {
            sql += ' WHERE customer_email = ?';
            params.push(email);
        }
        sql += ' ORDER BY created_at DESC';

        const result = db.exec(sql, params);
        if (result.length === 0) return [];
        return result[0].values.map(row => this._mapRow(result[0].columns, row));
    },

    updateStatus(orderId, status) {
        const db = getDB();
        db.run('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
        saveDB();
        return this.findByOrderId(orderId);
    },

    getStats() {
        const db = getDB();
        const result = db.exec(`
            SELECT
                COUNT(*) as orderCount,
                SUM(total) as totalRevenue,
                AVG(total) as avgOrderValue
            FROM orders
        `);
        if (result.length === 0 || !result[0].values[0][0]) {
            return { orderCount: 0, totalRevenue: 0, avgOrderValue: 0, totalItems: 0 };
        }
        const row = result[0].values[0];
        return {
            orderCount: row[0] || 0,
            totalRevenue: row[1] || 0,
            avgOrderValue: Math.round(row[2] || 0),
            totalItems: 0
        };
    },

    getRecent(limit = 5) {
        const db = getDB();
        const result = db.exec(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ${limit}`);
        if (result.length === 0) return [];
        return result[0].values.map(row => this._mapRow(result[0].columns, row));
    },

    getPendingCount() {
        const db = getDB();
        const result = db.exec("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'processing')");
        return result[0]?.values[0][0] || 0;
    },

    _mapRow(columns, row) {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return {
            id: obj.id,
            orderId: obj.order_id,
            userId: obj.user_id,
            customerName: obj.customer_name,
            customerEmail: obj.customer_email,
            items: JSON.parse(obj.items || '[]'),
            subtotal: obj.subtotal,
            tax: obj.tax,
            shippingCost: obj.shipping_cost,
            total: obj.total,
            shippingAddress: JSON.parse(obj.shipping_address || '{}'),
            paymentMethod: obj.payment_method,
            paymentLast4: obj.payment_last4,
            status: obj.status,
            createdAt: obj.created_at
        };
    }
};

module.exports = Order;