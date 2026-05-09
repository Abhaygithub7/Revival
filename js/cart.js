/**
 * Revival — Shopping Cart Module
 * Handles add/remove/update operations, localStorage persistence, and UI rendering.
 */

const Cart = (() => {
    const STORAGE_KEY = 'revival_cart';

    /** Load cart from localStorage */
    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    /** Persist cart to localStorage */
    function save(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        updateCartCount();
        renderCartSidebar();
    }

    /** Get current cart */
    function getItems() {
        return load();
    }

    /** Add item to cart */
    function addItem(productId) {
        const cart = load();
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id: productId, qty: 1 });
        }
        save(cart);
        showToast('Added to bag');
    }

    /** Remove item entirely */
    function removeItem(productId) {
        let cart = load();
        cart = cart.filter(item => item.id !== productId);
        save(cart);
    }

    /** Update quantity */
    function updateQty(productId, delta) {
        const cart = load();
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        item.qty = Math.max(1, item.qty + delta);
        save(cart);
    }

    /** Get total items count */
    function getCount() {
        return load().reduce((sum, i) => sum + i.qty, 0);
    }

    /** Get total price */
    function getTotal() {
        const cart = load();
        return cart.reduce((sum, item) => {
            const product = getProductById(item.id);
            return sum + (product ? product.price * item.qty : 0);
        }, 0);
    }

    /** Update the badge count in header */
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

    /** Render cart sidebar contents */
    function renderCartSidebar() {
        const body = document.getElementById('cart-body');
        const footer = document.getElementById('cart-footer');
        if (!body) return;

        const cart = load();
        if (cart.length === 0) {
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

        body.innerHTML = cart.map(cartItem => {
            const p = getProductById(cartItem.id);
            if (!p) return '';
            return `
                <div class="cart-item" data-cart-id="${p.id}">
                    <div class="cart-item-img">
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-display text-sm font-semibold text-brand truncate">${p.name}</p>
                        <p class="text-xs text-brand/50 mt-1">${p.era} · ${p.size}</p>
                        <div class="flex items-center justify-between mt-3">
                            <div class="flex items-center gap-2">
                                <button class="qty-btn" onclick="Cart.updateQty(${p.id}, -1)">−</button>
                                <span class="text-sm font-medium w-6 text-center">${cartItem.qty}</span>
                                <button class="qty-btn" onclick="Cart.updateQty(${p.id}, 1)">+</button>
                            </div>
                            <p class="font-semibold text-sm text-brand">$${(p.price * cartItem.qty).toFixed(0)}</p>
                        </div>
                    </div>
                    <button onclick="Cart.removeItem(${p.id})" class="text-brand/30 hover:text-terracotta transition-colors self-start mt-1">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            `;
        }).join('');

        const total = getTotal();
        const savings = cart.reduce((sum, item) => {
            const p = getProductById(item.id);
            return sum + (p ? (p.originalPrice - p.price) * item.qty : 0);
        }, 0);

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
                <button class="cta-btn w-full py-3.5 bg-brand text-cream font-semibold text-sm tracking-wide rounded-xl hover:bg-brand-dark transition-colors uppercase">
                    Checkout
                </button>
                <p class="text-center text-[11px] text-brand/40 mt-3">Free shipping on orders over $100</p>
            `;
        }
    }

    /** Show a toast notification */
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

    /** Open / Close sidebar */
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

    // Public API
    return { getItems, addItem, removeItem, updateQty, getCount, getTotal, updateCartCount, renderCartSidebar, openSidebar, closeSidebar, showToast };
})();
