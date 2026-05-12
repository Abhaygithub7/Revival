const { getDB } = require('../config/db');

const Order = {
    generateOrderId() {
        return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    },

    create(data) {
        const db = getDB();
        const order = {
            id: db.orders.length + 1,
            orderId: this.generateOrderId(),
            userId: data.userId || null,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            items: data.items,
            subtotal: data.subtotal,
            tax: data.tax,
            shippingCost: data.shippingCost,
            total: data.total,
            shippingAddress: data.shippingAddress || {},
            paymentMethod: data.paymentMethod || null,
            paymentLast4: data.paymentLast4 || null,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        db.orders.push(order);
        return order;
    },

    findById(id) {
        const db = getDB();
        return db.orders.find(o => o.id === parseInt(id));
    },

    findByOrderId(orderId) {
        const db = getDB();
        return db.orders.find(o => o.orderId === orderId);
    },

    findAll({ email, all = false } = {}) {
        let orders = [...db.orders];

        if (!all && email) {
            orders = orders.filter(o => o.customerEmail === email);
        }

        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    updateStatus(orderId, status) {
        const db = getDB();
        const order = db.orders.find(o => o.orderId === orderId);
        if (order) {
            order.status = status;
        }
        return order;
    },

    getStats() {
        const db = getDB();
        const totalRevenue = db.orders.reduce((sum, o) => sum + o.total, 0);
        const orderCount = db.orders.length;
        return {
            orderCount,
            totalRevenue,
            avgOrderValue: orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0,
            totalItems: 0
        };
    },

    getRecent(limit = 5) {
        return [...db.orders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    },

    getPendingCount() {
        const db = getDB();
        return db.orders.filter(o => ['pending', 'processing'].includes(o.status)).length;
    }
};

module.exports = Order;