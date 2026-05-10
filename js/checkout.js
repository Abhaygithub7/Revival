/**
 * Revival — Checkout Controller
 * Multi-step: shipping → payment → review → confirmation
 */

document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('revival_cart') || '[]');
    const user = CustomerAuth.getUser();

    // If cart is empty, redirect
    if (cart.length === 0) {
        document.querySelector('main').innerHTML = `
            <div class="text-center py-20">
                <i class="fas fa-shopping-bag text-5xl text-brand/15 mb-6 block"></i>
                <h2 class="font-display text-2xl font-bold text-brand mb-3">Your bag is empty</h2>
                <p class="text-brand/50 mb-8">Add some vintage finds before checking out.</p>
                <a href="index.html" class="cta-btn inline-flex px-8 py-3.5 bg-brand text-cream font-semibold text-sm uppercase tracking-wider rounded-xl hover:bg-brand-dark transition-colors">Browse Collection</a>
            </div>`;
        return;
    }

    // Pre-fill name/email if logged in
    if (user) {
        document.getElementById('sh-name').value = user.name || '';
        document.getElementById('sh-email').value = user.email || '';
    }

    renderAllSummaries();
    updateFreeShippingBanner();

    // --- Step navigation ---
    document.getElementById('to-payment-btn').addEventListener('click', () => {
        if (!validateShipping()) return;
        goToStep('payment');
    });

    document.getElementById('back-to-shipping-btn').addEventListener('click', () => goToStep('shipping'));
    document.getElementById('back-to-payment-btn').addEventListener('click', () => goToStep('payment'));

    document.getElementById('to-review-btn').addEventListener('click', () => {
        if (!validatePayment()) return;
        populateReview();
        goToStep('review');
    });

    document.getElementById('edit-shipping').addEventListener('click', () => goToStep('shipping'));
    document.getElementById('edit-payment').addEventListener('click', () => goToStep('payment'));

    document.getElementById('place-order-btn').addEventListener('click', placeOrder);

    // Shipping method change
    document.querySelectorAll('input[name="shipping-method"]').forEach(r => {
        r.addEventListener('change', () => {
            renderAllSummaries();
            updateFreeShippingBanner();
        });
    });

    // Card number formatting
    document.getElementById('pm-card').addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
    });

    document.getElementById('pm-expiry').addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
        e.target.value = val;
    });

    function goToStep(step) {
        document.querySelectorAll('.step-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(`step-${step}`).classList.remove('hidden');

        document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));
        const si = document.getElementById(`si-${step}`);
        if (si) si.classList.add('active');

        // Mark previous dots as done
        if (step === 'payment') document.getElementById('si-shipping').classList.add('active');
        if (step === 'review') {
            document.getElementById('si-shipping').classList.add('active');
            document.getElementById('si-payment').classList.add('active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateShipping() {
        const fields = ['sh-name', 'sh-email', 'sh-address', 'sh-city', 'sh-state', 'sh-zip'];
        let valid = true;
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (!el.value.trim()) {
                el.classList.add('border-red-400');
                valid = false;
            } else {
                el.classList.remove('border-red-400');
            }
        });
        if (!valid) showToast('Please fill in all shipping fields.', 'error');
        return valid;
    }

    function validatePayment() {
        const card = document.getElementById('pm-card').value.replace(/\s/g, '');
        const expiry = document.getElementById('pm-expiry').value;
        const cvv = document.getElementById('pm-cvv').value;
        const name = document.getElementById('pm-name').value;
        let valid = true;

        if (card.length !== 16) { document.getElementById('pm-card').classList.add('border-red-400'); valid = false; }
        else document.getElementById('pm-card').classList.remove('border-red-400');

        if (!/^\d{2}\/\d{2}$/.test(expiry)) { document.getElementById('pm-expiry').classList.add('border-red-400'); valid = false; }
        else document.getElementById('pm-expiry').classList.remove('border-red-400');

        if (cvv.length < 3) { document.getElementById('pm-cvv').classList.add('border-red-400'); valid = false; }
        else document.getElementById('pm-cvv').classList.remove('border-red-400');

        if (!name.trim()) { document.getElementById('pm-name').classList.add('border-red-400'); valid = false; }
        else document.getElementById('pm-name').classList.remove('border-red-400');

        if (!valid) showToast('Please check your payment details.', 'error');
        return valid;
    }

    function getCartItems() {
        return cart.map(ci => {
            const p = getProductById(ci.id);
            return p ? { ...ci, product: p } : null;
        }).filter(Boolean);
    }

    function getSubtotal() {
        return getCartItems().reduce((s, ci) => s + ci.product.price * ci.qty, 0);
    }

    function getShippingCost() {
        const method = document.querySelector('input[name="shipping-method"]:checked')?.value;
        const subtotal = getSubtotal();
        if (method === 'express') return 19.99;
        if (subtotal >= 100) return 0;
        return 8.99;
    }

    function getTax() {
        return Math.round(getSubtotal() * 0.085 * 100) / 100;
    }

    function getGrandTotal() {
        return Math.round((getSubtotal() + getShippingCost() + getTax()) * 100) / 100;
    }

    function renderSummary(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const items = getCartItems();
        const subtotal = getSubtotal();
        const shipping = getShippingCost();
        const tax = getTax();
        const grand = getGrandTotal();

        el.innerHTML = `
            <div class="bg-white border border-brand/10 rounded-2xl p-6 sticky top-24">
                <h3 class="font-display text-lg font-semibold mb-4">Order Summary</h3>
                <div class="space-y-3 mb-4">
                    ${items.map(ci => `
                        <div class="flex gap-3">
                            <img src="${ci.product.image}" alt="${ci.product.name}" class="w-14 h-16 object-cover rounded-lg flex-shrink-0">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium truncate">${ci.product.name}</p>
                                <p class="text-xs text-brand/50">Qty: ${ci.qty}</p>
                            </div>
                            <p class="text-sm font-semibold">$${(ci.product.price * ci.qty).toFixed(0)}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="border-t border-brand/10 pt-4 space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-brand/60">Subtotal</span><span>$${subtotal.toFixed(0)}</span></div>
                    <div class="flex justify-between"><span class="text-brand/60">Shipping</span><span>${shipping === 0 ? '<span class="text-sage font-medium">Free</span>' : '$' + shipping.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span class="text-brand/60">Tax (8.5%)</span><span>$${tax.toFixed(2)}</span></div>
                </div>
                <div class="border-t border-brand/10 pt-4 mt-4 flex justify-between font-bold text-base">
                    <span>Total</span><span>$${grand.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    function renderAllSummaries() {
        renderSummary('checkout-summary');
        renderSummary('checkout-summary-payment');
        renderSummary('checkout-summary-review');
    }

    function updateFreeShippingBanner() {
        const banner = document.getElementById('free-shipping-banner');
        const subtotal = getSubtotal();
        if (!banner) return;
        if (subtotal >= 100) {
            banner.classList.remove('hidden');
            document.getElementById('standard-price').innerHTML = '<span class="text-sage">Free</span>';
        } else {
            banner.classList.add('hidden');
            document.getElementById('standard-price').textContent = '$8.99';
        }
    }

    function populateReview() {
        const shipping = {
            name: document.getElementById('sh-name').value,
            email: document.getElementById('sh-email').value,
            address: document.getElementById('sh-address').value,
            city: document.getElementById('sh-city').value,
            state: document.getElementById('sh-state').value,
            zip: document.getElementById('sh-zip').value,
            country: document.getElementById('sh-country').value,
        };
        const method = document.querySelector('input[name="shipping-method"]:checked')?.value;
        const methodLabel = method === 'express' ? 'Express (2–3 days)' : 'Standard (5–7 days)';

        document.getElementById('review-shipping').innerHTML = `
            <p class="font-semibold">${shipping.name}</p>
            <p class="text-brand/60">${shipping.address}</p>
            <p class="text-brand/60">${shipping.city}, ${shipping.state} ${shipping.zip}</p>
            <p class="text-brand/60">${shipping.country}</p>
            <p class="text-xs text-brand/40 mt-2">${methodLabel}</p>
        `;

        const cardRaw = document.getElementById('pm-card').value;
        const last4 = cardRaw.replace(/\s/g, '').slice(-4);
        document.getElementById('review-payment').innerHTML = `
            <p class="font-semibold">${document.getElementById('pm-name').value}</p>
            <p class="text-brand/60">•••• •••• •••• ${last4}</p>
            <p class="text-brand/60">Expires ${document.getElementById('pm-expiry').value}</p>
        `;

        // Review items
        document.getElementById('review-items').innerHTML = getCartItems().map(ci => `
            <div class="flex gap-3 items-center p-3 bg-white border border-brand/10 rounded-xl">
                <img src="${ci.product.image}" alt="${ci.product.name}" class="w-12 h-16 object-cover rounded-lg">
                <div class="flex-1"><p class="text-sm font-semibold">${ci.product.name}</p><p class="text-xs text-brand/50">Qty: ${ci.qty} · $${ci.product.price} each</p></div>
                <p class="text-sm font-semibold">$${(ci.product.price * ci.qty).toFixed(0)}</p>
            </div>
        `).join('');
    }

    function placeOrder() {
        const btn = document.getElementById('place-order-btn');
        const text = document.getElementById('place-order-text');
        const spinner = document.getElementById('place-order-spinner');
        btn.disabled = true;
        text.textContent = 'Placing Order...';
        spinner.classList.remove('hidden');

        const shipping = {
            name: document.getElementById('sh-name').value,
            email: document.getElementById('sh-email').value,
            address: document.getElementById('sh-address').value,
            city: document.getElementById('sh-city').value,
            state: document.getElementById('sh-state').value,
            zip: document.getElementById('sh-zip').value,
            country: document.getElementById('sh-country').value,
        };
        const method = document.querySelector('input[name="shipping-method"]:checked')?.value;
        const shippingLabel = method === 'express' ? 'Express (2–3 days)' : 'Standard (5–7 days)';

        const payment = {
            method: document.getElementById('pm-card')?.value.startsWith('4') ? 'Visa' : 'Card',
            last4: document.getElementById('pm-card').value.replace(/\s/g, '').slice(-4),
        };

        const customer = { name: shipping.name, email: shipping.email };

        // Save address if logged in
        if (CustomerAuth.isLoggedIn()) {
            CustomerAuth.addAddress(shipping);
        }

        // Auto-register guest as a user for order tracking
        if (!CustomerAuth.isLoggedIn()) {
            // Store guest session for order tracking
            const guestSession = { id: Date.now(), name: shipping.name, email: shipping.email, loggedInAt: new Date().toISOString(), guest: true };
            localStorage.setItem('revival_customer_session', JSON.stringify(guestSession));
        }

        // Simulate processing
        setTimeout(() => {
            const order = Orders.place(cart, customer, shipping, payment);

            // Clear cart
            localStorage.removeItem('revival_cart');

            // Show confirmation
            document.getElementById('confirmed-order-id').textContent = order.id;
            document.getElementById('confirmation-details').innerHTML = `
                <p><span class="text-brand/50">Date:</span> ${order.date}</p>
                <p><span class="text-brand/50">Shipping:</span> ${shippingLabel}</p>
                <p><span class="text-brand/50">Address:</span> ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}</p>
                <p class="pt-2 font-semibold">Total: $${order.total.toFixed(2)}</p>
            `;
            document.getElementById('view-order-link').href = `account.html?order=${order.id}`;

            document.querySelectorAll('.step-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('step-confirmation').classList.remove('hidden');
            document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    }

    function showToast(msg, type) {
        let container = document.getElementById('checkout-toast');
        if (!container) {
            container = document.createElement('div');
            container.id = 'checkout-toast';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const icons = { error: 'fa-exclamation-circle text-red-400', success: 'fa-check-circle text-sage' };
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i><span>${msg}</span>`;
        container.appendChild(t);
        setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
    }
});

// Add checkout-specific input styles
const style = document.createElement('style');
style.textContent = `
    .checkout-input {
        padding: 12px 14px; border: 1px solid rgba(74,63,53,0.15);
        border-radius: 12px; font-size: 14px; background: #fff;
        outline: none; transition: border-color 0.2s ease;
        font-family: 'Inter', sans-serif; color: #4A3F35;
    }
    .checkout-input:focus { border-color: #C17D5B; }
    .checkout-input.border-red-400 { border-color: #f87171; }
    .step-dot {
        font-size: 13px; font-weight: 500; color: #8B7E74;
        padding: 4px 0;
    }
    .step-dot.active { color: #C17D5B; font-weight: 600; }
    .shipping-option:has(input:checked) { border-color: #C17D5B; background: rgba(193,125,91,0.04); }
`;
document.head.appendChild(style);