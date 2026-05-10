/**
 * Revival — Orders Module
 * Creates orders, stores them (shared with admin), retrieves by customer.
 * Uses same localStorage key as admin panel so orders appear in dashboard.
 */
const Orders = (() => {
    const KEY = 'revival_admin_orders';

    function loadAll() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch { return []; }
    }

    function saveAll(orders) {
        localStorage.setItem(KEY, JSON.stringify(orders));
    }

    /** Generate a unique order ID */
    function generateId() {
        const existing = loadAll();
        const max = existing.reduce((m, o) => {
            const n = parseInt(o.id.replace('ORD-', ''));
            return n > m ? n : m;
        }, 1000);
        return `ORD-${max + 1}`;
    }

    /** Place an order. cartItems: [{id, qty}], customer: {name, email}, shipping: {...}, payment: {...} */
    function place(cartItems, customer, shipping, payment) {
        const orders = loadAll();
        const total = cartItems.reduce((sum, item) => {
            const p = getProductById(item.id);
            return sum + (p ? p.price * item.qty : 0);
        }, 0);
        const tax = Math.round(total * 0.085 * 100) / 100;
        const shippingCost = total >= 100 ? 0 : 8.99;
        const grandTotal = Math.round((total + tax + shippingCost) * 100) / 100;

        const order = {
            id: generateId(),
            customer: customer.name,
            email: customer.email,
            items: cartItems.map(i => ({ productId: i.id, qty: i.qty })),
            total: grandTotal,
            subtotal: total,
            tax,
            shippingCost,
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            address: shipping,
            payment: { method: payment.method, last4: payment.last4 || null },
        };
        orders.push(order);
        saveAll(orders);
        return order;
    }

    /** Get orders for a customer by email */
    function getByEmail(email) {
        return loadAll().filter(o => o.email === email).reverse();
    }

    /** Get a single order by ID */
    function getById(id) {
        return loadAll().find(o => o.id === id);
    }

    return { place, getByEmail, getById, generateId };
})();