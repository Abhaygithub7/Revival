/**
 * Revival — Shopping Cart Module
 * Hybrid: localStorage for guests, API for logged-in users.
 */

const Cart = (() => {
    const STORAGE_KEY = 'revival_cart';
    let _items = [];

    async function init() {
        if (API.isAuthenticated()) {
            const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (local.length > 0) {
                const payload = local.map(i => ({ productId: i.id, qty: i.qty }));
                await API.post('/cart/merge', { items: payload });
                localStorage.removeItem(STORAGE_KEY);
            }
            const res = await API.get('/cart');
            if (!res.error) _items = res.items || [];
        } else {
            const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            _items = [];
            for (const item of local) {
                const p = await getProductById(item.id);
                if (p) _items.push({ id: p._id, name: p.name, price: p.price, originalPrice: p.originalPrice, image: p.image, era: p.era, size: p.size, qty: item.qty });
            }
        }
        updateCartCount();
        renderCartSidebar();
    }

    async function save() {
        if (API.isAuthenticated()) {
            const payload = _items.map(i => ({ productId: i.id, qty: i.qty }));
            API.put('/cart', { items: payload }); // background save
        } else {
            const local = _items.map(i => ({ id: i.id, qty: i.qty }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
        }
        updateCartCount();
        renderCartSidebar();
    }

    function getItems() { return _items; }

    async function addItem(productId) {
        let item = _items.find(i => i.id === productId);
        if (item) {
            item.qty += 1;
        } else {
            const p = await getProductById(productId);
            if (p) {
                _items.push({ id: p._id, name: p.name, price: p.price, originalPrice: p.originalPrice, image: p.image, era: p.era, size: p.size, qty: 1 });
            }
        }
        await save();
        showToast('Added to bag');
    }

    async function removeItem(productId) {
        _items = _items.filter(i => i.id !== productId);
        await save();
    }

    async function updateQty(productId, delta) {
        const item = _items.find(i => i.id === productId);
        if (!item) return;
        item.qty = Math.max(1, item.qty + delta);
        await save();
    }

    function getCount() {
        return _items.reduce((sum, i) => sum + i.qty, 0);
    }

    function getTotal() {
        return _items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    }

    function updateCartCount() {
        const badge = document.getElementById('cart-count');
        const count = getCount();
        if (badge) {
            badge.textContent = count;
            if (count > 0) {
                badge.classList.remove('opacity-0', 'scale-50');
                badge.classList.add('opacity-100', 'scale-100');
            } else {
                badge.classList.add('opacity-0', 'scale-50');
                badge.classList.remove('opacity-100', 'scale-100');
            }
        }
    }

    function renderCartSidebar() {
        const body = document.getElementById('cart-body');
        const footer = document.getElementById('cart-footer');
        if (!body) return;

        if (_items.length === 0) {
            body.innerHTML = `
                <div class="cart-empty-state">
                    <i class="fas fa-shopping-bag text-4xl text-brand/20 mb-4"></i>
                    <p class="font-display text-lg text-brand/60 mb-2">Your bag is empty</p>
                    <p class="text-sm text-brand/40">Discover unique vintage finds curated just for you.</p>
                </div>
            `;
            if (footer) footer.innerHTML = '';
            return;
        }

        body.innerHTML = _items.map(p => `
            <div class="cart-item" data-cart-id="${p.id}">
                <div class="cart-item-img">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-display text-sm font-semibold text-brand truncate">${p.name}</p>
                    <p class="text-xs text-brand/50 mt-1">${p.era} · ${p.size}</p>
                    <div class="flex items-center justify-between mt-3">
                        <div class="flex items-center gap-2">
                            <button class="qty-btn" onclick="Cart.updateQty('${p.id}', -1)">−</button>
                            <span class="text-sm font-medium w-6 text-center">${p.qty}</span>
                            <button class="qty-btn" onclick="Cart.updateQty('${p.id}', 1)">+</button>
                        </div>
                        <p class="font-semibold text-sm text-brand">$${(p.price * p.qty).toFixed(0)}</p>
                    </div>
                </div>
                <button onclick="Cart.removeItem('${p.id}')" class="text-brand/30 hover:text-terracotta transition-colors self-start mt-1">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `).join('');

        const total = getTotal();
        const savings = _items.reduce((sum, p) => sum + ((p.originalPrice || p.price) - p.price) * p.qty, 0);

        if (footer) {
            footer.innerHTML = `
                <div class="flex justify-between text-sm text-brand/60 mb-2">
                    <span>Subtotal</span>
                    <span>$${total.toFixed(0)}</span>
                </div>
                <div class="flex justify-between text-sm text-sage font-medium mb-4">
                    <span>You save</span>
                    <span>-$${savings.toFixed(0)}</span>
                </div>
                <div class="flex justify-between text-base font-bold text-brand mb-5">
                    <span>Total</span>
                    <span>$${total.toFixed(0)}</span>
                </div>
                <a href="checkout.html" class="cta-btn block text-center w-full py-3.5 bg-brand text-cream font-semibold text-sm tracking-wide rounded-xl hover:bg-brand-dark transition-colors uppercase">
                    Checkout
                </a>
                <p class="text-center text-[11px] text-brand/40 mt-3">Free shipping on orders over $100</p>
            `;
        }
    }

    function showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle text-sage"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    function openSidebar() {
        document.getElementById('cart-overlay')?.classList.add('open');
        document.getElementById('cart-sidebar')?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        document.getElementById('cart-overlay')?.classList.remove('open');
        document.getElementById('cart-sidebar')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    return { init, getItems, addItem, removeItem, updateQty, getCount, getTotal, updateCartCount, renderCartSidebar, openSidebar, closeSidebar, showToast };
})();
