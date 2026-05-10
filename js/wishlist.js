/**
 * Revival — Wishlist Module
 * Persistent wishlist with localStorage, no dependencies.
 */
const Wishlist = (() => {
    const KEY = 'revival_wishlist';

    function load() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch { return []; }
    }

    function save(ids) {
        localStorage.setItem(KEY, JSON.stringify(ids));
    }

    function has(productId) {
        return load().includes(productId);
    }

    function toggle(productId) {
        const ids = load();
        const idx = ids.indexOf(productId);
        if (idx === -1) {
            ids.push(productId);
            save(ids);
            return true;
        } else {
            ids.splice(idx, 1);
            save(ids);
            return false;
        }
    }

    function getAll() {
        return load();
    }

    function getCount() {
        return load().length;
    }

    function getProducts() {
        return load().map(id => getProductById(id)).filter(Boolean);
    }

    /** Render wishlist items in a container */
    function render(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const products = getProducts();
        if (products.length === 0) {
            el.innerHTML = `<div class="text-center py-12 text-brand/40"><i class="far fa-heart text-4xl mb-3 block"></i><p>No saved items yet.</p></div>`;
            return;
        }
        el.innerHTML = products.map(p => `
            <div class="flex items-center gap-4 p-4 border-b border-brand/5">
                <img src="${p.image}" alt="${p.name}" class="w-16 h-20 object-cover rounded-lg">
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-brand truncate">${p.name}</p>
                    <p class="text-xs text-brand/50">${p.era} · $${p.price}</p>
                </div>
                <button onclick="Wishlist.toggle(${p.id}); Wishlist.render('wishlist-container')" class="text-brand/30 hover:text-terracotta transition-colors">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `).join('');
    }

    return { has, toggle, getAll, getCount, getProducts, render };
})();