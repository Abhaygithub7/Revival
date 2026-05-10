/**
 * Revival — Account Page Controller
 * Handles auth tabs, order history, wishlist, profile display.
 */

document.addEventListener('DOMContentLoaded', () => {
    const user = CustomerAuth.getUser();

    if (!user) {
        document.getElementById('account-content').classList.add('hidden');
        document.getElementById('auth-required').classList.remove('hidden');
        setupAuthForms();
        return;
    }

    document.getElementById('auth-required').classList.add('hidden');
    renderAccount(user);

    document.getElementById('account-logout').addEventListener('click', () => {
        CustomerAuth.logout();
        window.location.reload();
    });

    // Highlight specific order from URL param
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    if (orderId) {
        setTimeout(() => {
            const el = document.getElementById(`order-${orderId}`);
            if (el) { el.scrollIntoView({ behavior: 'smooth' }); el.classList.add('ring-2', 'ring-terracotta'); }
        }, 300);
    }
});

function setupAuthForms() {
    let mode = 'login';

    document.getElementById('auth-tab-login').addEventListener('click', () => {
        mode = 'login';
        document.getElementById('auth-tab-login').classList.add('active');
        document.getElementById('auth-tab-register').classList.remove('active');
        document.getElementById('auth-extra-fields').classList.add('hidden');
        document.getElementById('auth-submit-btn').textContent = 'Sign In';
        document.getElementById('auth-error').classList.add('hidden');
    });

    document.getElementById('auth-tab-register').addEventListener('click', () => {
        mode = 'register';
        document.getElementById('auth-tab-register').classList.add('active');
        document.getElementById('auth-tab-login').classList.remove('active');
        document.getElementById('auth-extra-fields').classList.remove('hidden');
        document.getElementById('auth-submit-btn').textContent = 'Create Account';
        document.getElementById('auth-error').classList.add('hidden');
    });

    document.getElementById('auth-submit-btn').addEventListener('click', () => {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const errorEl = document.getElementById('auth-error');

        if (!email || !password) {
            errorEl.textContent = 'Please fill in all fields.';
            errorEl.classList.remove('hidden');
            return;
        }

        let result;
        if (mode === 'register') {
            const name = document.getElementById('reg-name').value.trim();
            if (!name) { errorEl.textContent = 'Please enter your name.'; errorEl.classList.remove('hidden'); return; }
            result = CustomerAuth.register(name, email, password);
        } else {
            result = CustomerAuth.login(email, password);
        }

        if (result.success) {
            window.location.reload();
        } else {
            errorEl.textContent = result.error;
            errorEl.classList.remove('hidden');
        }
    });
}

function renderAccount(user) {
    const orders = Orders.getByEmail(user.email);
    const wishlistProducts = Wishlist.getProducts();

    document.getElementById('account-content').innerHTML = `
        <div class="flex flex-wrap justify-between items-start gap-6 mb-10">
            <div>
                <h1 class="font-display text-3xl md:text-4xl font-bold text-brand mb-1">Hi, ${user.name.split(' ')[0]}</h1>
                <p class="text-brand/50">${user.email}</p>
            </div>
            <div class="flex gap-4">
                <a href="index.html" class="cta-btn inline-flex px-6 py-3 bg-brand text-cream font-semibold text-sm uppercase tracking-wider rounded-xl hover:bg-brand-dark transition-colors">Shop</a>
            </div>
        </div>

        <!-- Order History -->
        <section class="mb-12">
            <h2 class="font-display text-2xl font-bold text-brand mb-6">Order History</h2>
            ${orders.length === 0 ? `
                <div class="bg-white border border-brand/10 rounded-2xl p-10 text-center">
                    <i class="fas fa-shopping-cart text-3xl text-brand/15 mb-3 block"></i>
                    <p class="text-brand/50">No orders yet.</p>
                    <a href="index.html" class="text-terracotta text-sm font-medium mt-2 inline-block hover:underline">Start shopping →</a>
                </div>
            ` : orders.map(o => `
                <div id="order-${o.id}" class="bg-white border border-brand/10 rounded-2xl p-6 mb-4 transition-all duration-500">
                    <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                            <p class="font-mono text-sm font-semibold">${o.id}</p>
                            <p class="text-xs text-brand/50">${o.date}</p>
                        </div>
                        <span class="badge badge-${getOrderBadge(o.status)}">${o.status}</span>
                    </div>
                    <div class="space-y-3">
                        ${o.items.map(item => {
                            const p = getProductById(item.productId);
                            if (!p) return '';
                            return `
                                <div class="flex gap-3 items-center">
                                    <img src="${p.image}" alt="${p.name}" class="w-12 h-16 object-cover rounded-lg">
                                    <div class="flex-1"><p class="text-sm font-medium">${p.name}</p><p class="text-xs text-brand/50">Qty: ${item.qty}</p></div>
                                    <p class="text-sm font-semibold">$${(p.price * item.qty).toFixed(0)}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="border-t border-brand/10 mt-4 pt-4 flex justify-between text-sm">
                        <span class="text-brand/50">Total</span>
                        <span class="font-bold">$${o.total.toFixed(2)}</span>
                    </div>
                    ${o.address ? `
                        <div class="mt-3 text-xs text-brand/50">
                            <i class="fas fa-map-marker-alt mr-1"></i>${o.address.city}, ${o.address.state} ${o.address.zip}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </section>

        <!-- Wishlist -->
        <section class="mb-12">
            <h2 class="font-display text-2xl font-bold text-brand mb-6">Wishlist (${wishlistProducts.length})</h2>
            <div id="wishlist-container" class="bg-white border border-brand/10 rounded-2xl divide-y divide-brand/5"></div>
        </section>
    `;

    // Render wishlist
    Wishlist.render('wishlist-container');
}

function getOrderBadge(status) {
    const map = { pending: 'warning', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger' };
    const cls = map[status] || 'neutral';
    return cls;
}

// Badge styles
const style = document.createElement('style');
style.textContent = `
    .checkout-input {
        padding: 12px 14px; border: 1px solid rgba(74,63,53,0.15);
        border-radius: 12px; font-size: 14px; background: #fff;
        outline: none; transition: border-color 0.2s ease;
        font-family: 'Inter', sans-serif; color: #4A3F35; width: 100%;
    }
    .checkout-input:focus { border-color: #C17D5B; }
    .auth-tab { font-size: 13px; font-weight: 500; color: #8B7E74; cursor: pointer; transition: color 0.2s; }
    .auth-tab.active { color: #C17D5B; font-weight: 600; }
    .badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 12px; border-radius: 20px;
        font-size: 11px; font-weight: 600; text-transform: uppercase;
    }
    .badge-success { background: rgba(143,158,139,0.15); color: #8F9E8B; }
    .badge-warning { background: rgba(251,191,36,0.12); color: #c49b0c; }
    .badge-info { background: rgba(96,165,250,0.12); color: #60a5fa; }
    .badge-danger { background: rgba(248,113,113,0.12); color: #f87171; }
    .badge-neutral { background: rgba(139,126,116,0.12); color: #8B7E74; }
`;
document.head.appendChild(style);