/**
 * Revival — Unified Product Data Store
 * Fetches from backend API.
 */

let _productCache = null;

async function getActiveProducts() {
    if (_productCache) return _productCache;
    const res = await API.get('/products');
    if (res.error) return [];
    _productCache = res.products;
    return _productCache;
}

async function getCategories() {
    const res = await API.get('/products/categories');
    return res.categories || ['all'];
}

async function getProductsByCategory(category) {
    if (category === 'all') return await getActiveProducts();
    const res = await API.get(`/products?category=${encodeURIComponent(category)}`);
    return res.products || [];
}

async function getProductById(id) {
    const res = await API.get(`/products/${id}`);
    return res.product || null;
}

async function searchProducts(query) {
    const q = query.trim();
    if (!q) return await getActiveProducts();
    const res = await API.get(`/products?search=${encodeURIComponent(q)}`);
    return res.products || [];
}
