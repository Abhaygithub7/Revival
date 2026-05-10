/**
 * Revival — Orders Module
 * Creates and retrieves orders via API.
 */
const Orders = (() => {

    /** Place an order. cartItems: [{id, qty}], customer: {name, email}, shipping: {...}, payment: {...} */
    async function place(cartItems, customer, shipping, payment) {
        const payload = {
            items: cartItems.map(i => ({ productId: i.id || i.productId, qty: i.qty })),
            customer,
            shipping,
            payment,
        };
        const res = await API.post('/orders', payload);
        if (res.error) return { error: res.error };
        return res.order;
    }

    /** Get orders for current user (or guest needs email lookup logic, though API protects it) */
    async function getMyOrders() {
        if (!API.isAuthenticated()) return [];
        const res = await API.get('/orders');
        return res.orders || [];
    }

    /** Get a single order by ID */
    async function getById(id) {
        if (!API.isAuthenticated()) return null;
        const res = await API.get(`/orders/${id}`);
        return res.order || null;
    }

    return { place, getMyOrders, getById };
})();