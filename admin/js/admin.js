/**
 * Revival Admin — Dashboard Controller
 */

/* ====== MOCK DATA ====== */
const ADMIN_PRODUCTS_KEY = 'revival_admin_products';
const ADMIN_ORDERS_KEY = 'revival_admin_orders';
const ADMIN_SETTINGS_KEY = 'revival_admin_settings';

function getDefaultProducts() {
    return [
        { id: 1, name: "California Dreamin' Denim Jacket", price: 78, originalPrice: 120, category: "outerwear", era: "1970s", size: "M", stock: 1, status: "active", image: "../images/vintage_denim_jacket.png" },
        { id: 2, name: "Heritage Leather Satchel", price: 95, originalPrice: 160, category: "accessories", era: "1980s", size: "One Size", stock: 1, status: "active", image: "../images/leather_satchel_bag.png" },
        { id: 3, name: "Round Gold-Rimmed Sunglasses", price: 42, originalPrice: 75, category: "accessories", era: "1960s", size: "One Size", stock: 2, status: "active", image: "../images/vintage_sunglasses.png" },
        { id: 4, name: "Sage Wool Cardigan", price: 56, originalPrice: 90, category: "knitwear", era: "1990s", size: "L", stock: 1, status: "active", image: "../images/wool_cardigan.png" },
        { id: 5, name: "Rugged Heritage Boots", price: 112, originalPrice: 185, category: "footwear", era: "1970s", size: "10 US", stock: 1, status: "active", image: "../images/leather_boots.png" },
        { id: 6, name: "Floral Silk Scarf", price: 34, originalPrice: 55, category: "accessories", era: "1980s", size: "90×90cm", stock: 3, status: "active", image: "../images/silk_scarf.png" },
        { id: 7, name: "Oversized Linen Blazer", price: 68, originalPrice: 110, category: "outerwear", era: "1990s", size: "M/L", stock: 1, status: "active", image: "../images/linen_blazer.png" },
        { id: 8, name: "Hand-Painted Ceramic Vase", price: 48, originalPrice: 80, category: "home", era: "1960s", size: "H: 28cm", stock: 2, status: "active", image: "../images/ceramic_vase.png" },
    ];
}

function getDefaultOrders() {
    return [
        { id: 'ORD-1001', customer: 'Sarah Mitchell', email: 'sarah@email.com', items: [{ productId: 1, qty: 1 }], total: 78, status: 'delivered', date: '2026-05-08', address: '123 Oak St, Portland, OR' },
        { id: 'ORD-1002', customer: 'James Kim', email: 'james@email.com', items: [{ productId: 2, qty: 1 }, { productId: 6, qty: 1 }], total: 129, status: 'shipped', date: '2026-05-09', address: '456 Pine Ave, Seattle, WA' },
        { id: 'ORD-1003', customer: 'Amara Lee', email: 'amara@email.com', items: [{ productId: 4, qty: 1 }], total: 56, status: 'processing', date: '2026-05-09', address: '789 Elm Blvd, Austin, TX' },
        { id: 'ORD-1004', customer: 'David Chen', email: 'david@email.com', items: [{ productId: 5, qty: 1 }, { productId: 3, qty: 1 }], total: 154, status: 'pending', date: '2026-05-10', address: '321 Maple Dr, Denver, CO' },
        { id: 'ORD-1005', customer: 'Emma Watson', email: 'emma@email.com', items: [{ productId: 8, qty: 2 }], total: 96, status: 'pending', date: '2026-05-10', address: '555 Cedar Ln, Brooklyn, NY' },
    ];
}

function getDefaultSettings() {
    return { storeName: 'Revival', tagline: 'Curated Thrift', currency: 'USD', taxRate: 8.5, freeShippingThreshold: 100, flatShippingRate: 8.99 };
}

/* ====== DATA ACCESS ====== */
function loadProducts() { try { return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || getDefaultProducts(); } catch { return getDefaultProducts(); } }
function saveProducts(p) { localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(p)); }
function loadOrders() { try { return JSON.parse(localStorage.getItem(ADMIN_ORDERS_KEY)) || getDefaultOrders(); } catch { return getDefaultOrders(); } }
function saveOrders(o) { localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(o)); }
function loadSettings() { try { return JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY)) || getDefaultSettings(); } catch { return getDefaultSettings(); } }
function saveSettings(s) { localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(s)); }

// Initialize data on first load
if (!localStorage.getItem(ADMIN_PRODUCTS_KEY)) saveProducts(getDefaultProducts());
if (!localStorage.getItem(ADMIN_ORDERS_KEY)) saveOrders(getDefaultOrders());

/* ====== TOAST ====== */
function showAdminToast(msg, type = 'success') {
    const c = document.getElementById('admin-toast-container');
    const icons = { success: 'fa-check-circle text-green-400', error: 'fa-exclamation-circle text-red-400', info: 'fa-info-circle text-blue-400' };
    const t = document.createElement('div');
    t.className = 'admin-toast';
    t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
}

/* ====== NAVIGATION ====== */
function navigateTo(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
    document.getElementById('topbar-title').textContent = {
        dashboard: 'Dashboard', products: 'Products', orders: 'Orders', customers: 'Customers', settings: 'Settings'
    }[section] || 'Dashboard';
    // Re-render section
    if (section === 'dashboard') renderDashboard();
    else if (section === 'products') renderProductsTable();
    else if (section === 'orders') renderOrdersTable();
    else if (section === 'customers') renderCustomers();
    else if (section === 'settings') renderSettings();
}

/* ====== DASHBOARD OVERVIEW ====== */
function renderDashboard() {
    const products = loadProducts();
    const orders = loadOrders();
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const activeProducts = products.filter(p => p.status === 'active').length;
    const customers = [...new Set(orders.map(o => o.email))].length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

    document.getElementById('stat-revenue').textContent = `$${revenue.toLocaleString()}`;
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-products').textContent = activeProducts;
    document.getElementById('stat-customers').textContent = customers;

    // Revenue change indicators (mock)
    document.getElementById('stat-revenue-change').textContent = '+12.5%';
    document.getElementById('stat-orders-change').textContent = `${pendingOrders} pending`;

    // Recent orders
    const tbody = document.getElementById('recent-orders-body');
    tbody.innerHTML = orders.slice(0, 5).map(o => `
        <tr>
            <td class="font-mono text-xs">${o.id}</td>
            <td>${o.customer}</td>
            <td>$${o.total}</td>
            <td><span class="badge badge-${getStatusBadge(o.status)}">${o.status}</span></td>
            <td class="text-xs" style="color:var(--text-muted)">${o.date}</td>
        </tr>
    `).join('');

    // Draw chart
    drawRevenueChart();
}

function getStatusBadge(status) {
    return { pending: 'warning', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger' }[status] || 'neutral';
}

function drawRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;

    const data = [420, 680, 590, 820, 750, 960, 1100, 890, 1250, 1080, 1340, 1500];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const max = Math.max(...data) * 1.15;
    const padL = 50, padR = 20, padT = 20, padB = 40;
    const chartW = w - padL - padR, chartH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padT + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
        ctx.fillStyle = '#55556a'; ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('$' + Math.round(max - (max / 4) * i), padL - 8, y + 4);
    }

    // Bars
    const barW = chartW / data.length * 0.55;
    const gap = chartW / data.length;
    data.forEach((val, i) => {
        const barH = (val / max) * chartH;
        const x = padL + gap * i + (gap - barW) / 2;
        const y = padT + chartH - barH;

        const grad = ctx.createLinearGradient(x, y, x, padT + chartH);
        grad.addColorStop(0, '#C17D5B');
        grad.addColorStop(1, 'rgba(193,125,91,0.15)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
        ctx.fill();

        // Label
        ctx.fillStyle = '#55556a'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
        ctx.fillText(labels[i], padL + gap * i + gap / 2, h - 12);
    });
}

/* ====== PRODUCTS MANAGEMENT ====== */
function renderProductsTable(filter = '') {
    let products = loadProducts();
    if (filter) products = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.category.includes(filter.toLowerCase()));

    document.getElementById('products-count').textContent = `${products.length} products`;
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    <img src="${p.image}" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">
                    <div>
                        <div style="font-weight:500;font-size:13px;">${p.name}</div>
                        <div style="font-size:11px;color:var(--text-muted);">${p.era} · ${p.category}</div>
                    </div>
                </div>
            </td>
            <td>$${p.price}</td>
            <td>$${p.originalPrice}</td>
            <td>${p.stock}</td>
            <td><span class="badge badge-${p.status === 'active' ? 'success' : 'neutral'}">${p.status}</span></td>
            <td>
                <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm" onclick="openEditProduct(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddProduct() {
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-form').dataset.editId = '';
    openModal('product-modal');
}

function openEditProduct(id) {
    const p = loadProducts().find(x => x.id === id);
    if (!p) return;
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('pf-name').value = p.name;
    document.getElementById('pf-price').value = p.price;
    document.getElementById('pf-original-price').value = p.originalPrice;
    document.getElementById('pf-category').value = p.category;
    document.getElementById('pf-era').value = p.era;
    document.getElementById('pf-size').value = p.size;
    document.getElementById('pf-stock').value = p.stock;
    document.getElementById('pf-status').value = p.status;
    document.getElementById('product-form').dataset.editId = id;
    openModal('product-modal');
}

function saveProduct() {
    const form = document.getElementById('product-form');
    const editId = form.dataset.editId ? Number(form.dataset.editId) : null;
    const data = {
        name: document.getElementById('pf-name').value,
        price: Number(document.getElementById('pf-price').value),
        originalPrice: Number(document.getElementById('pf-original-price').value),
        category: document.getElementById('pf-category').value,
        era: document.getElementById('pf-era').value,
        size: document.getElementById('pf-size').value,
        stock: Number(document.getElementById('pf-stock').value),
        status: document.getElementById('pf-status').value,
        image: '../images/vintage_denim_jacket.png', // default image for new products
    };
    if (!data.name || !data.price) { showAdminToast('Please fill required fields', 'error'); return; }

    const products = loadProducts();
    if (editId) {
        const idx = products.findIndex(p => p.id === editId);
        if (idx !== -1) { products[idx] = { ...products[idx], ...data }; }
    } else {
        data.id = Math.max(0, ...products.map(p => p.id)) + 1;
        products.push(data);
    }
    saveProducts(products);
    closeModal('product-modal');
    renderProductsTable();
    showAdminToast(editId ? 'Product updated' : 'Product added');
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    const products = loadProducts().filter(p => p.id !== id);
    saveProducts(products);
    renderProductsTable();
    showAdminToast('Product deleted', 'info');
}

/* ====== ORDERS MANAGEMENT ====== */
function renderOrdersTable(filter = '') {
    let orders = loadOrders();
    if (filter) orders = orders.filter(o => o.id.toLowerCase().includes(filter.toLowerCase()) || o.customer.toLowerCase().includes(filter.toLowerCase()) || o.status === filter.toLowerCase());

    document.getElementById('orders-count').textContent = `${orders.length} orders`;
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td class="font-mono text-xs">${o.id}</td>
            <td>
                <div><span style="font-weight:500;">${o.customer}</span></div>
                <div style="font-size:11px;color:var(--text-muted);">${o.email}</div>
            </td>
            <td>${o.items.reduce((s, i) => s + i.qty, 0)} item(s)</td>
            <td style="font-weight:600;">$${o.total}</td>
            <td><span class="badge badge-${getStatusBadge(o.status)}">${o.status}</span></td>
            <td class="text-xs" style="color:var(--text-muted);">${o.date}</td>
            <td>
                <select class="form-select" style="width:130px;padding:6px 10px;font-size:11px;" onchange="updateOrderStatus('${o.id}', this.value)">
                    ${['pending','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
                </select>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, newStatus) {
    const orders = loadOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) { order.status = newStatus; saveOrders(orders); renderOrdersTable(); showAdminToast(`Order ${orderId} → ${newStatus}`); }
}

/* ====== CUSTOMERS ====== */
function renderCustomers() {
    const orders = loadOrders();
    const customerMap = {};
    orders.forEach(o => {
        if (!customerMap[o.email]) customerMap[o.email] = { name: o.customer, email: o.email, orders: 0, totalSpent: 0, lastOrder: o.date };
        customerMap[o.email].orders++;
        customerMap[o.email].totalSpent += o.total;
        if (o.date > customerMap[o.email].lastOrder) customerMap[o.email].lastOrder = o.date;
    });
    const customers = Object.values(customerMap);
    const tbody = document.getElementById('customers-table-body');
    tbody.innerHTML = customers.map(c => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--terracotta-glow);display:flex;align-items:center;justify-content:center;color:var(--terracotta);font-weight:700;font-size:14px;">${c.name.charAt(0)}</div>
                    <div><div style="font-weight:500;">${c.name}</div><div style="font-size:11px;color:var(--text-muted);">${c.email}</div></div>
                </div>
            </td>
            <td>${c.orders}</td>
            <td style="font-weight:600;">$${c.totalSpent}</td>
            <td class="text-xs" style="color:var(--text-muted);">${c.lastOrder}</td>
        </tr>
    `).join('');
}

/* ====== SETTINGS ====== */
function renderSettings() {
    const s = loadSettings();
    document.getElementById('sf-store-name').value = s.storeName;
    document.getElementById('sf-tagline').value = s.tagline;
    document.getElementById('sf-currency').value = s.currency;
    document.getElementById('sf-tax-rate').value = s.taxRate;
    document.getElementById('sf-free-shipping').value = s.freeShippingThreshold;
    document.getElementById('sf-flat-shipping').value = s.flatShippingRate;
}

function saveSettingsForm() {
    const s = {
        storeName: document.getElementById('sf-store-name').value,
        tagline: document.getElementById('sf-tagline').value,
        currency: document.getElementById('sf-currency').value,
        taxRate: Number(document.getElementById('sf-tax-rate').value),
        freeShippingThreshold: Number(document.getElementById('sf-free-shipping').value),
        flatShippingRate: Number(document.getElementById('sf-flat-shipping').value),
    };
    saveSettings(s);
    showAdminToast('Settings saved');
}

/* ====== MODAL HELPERS ====== */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

/* ====== INIT ====== */
document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.check();
    if (!user) return;

    document.getElementById('admin-user-name').textContent = user.name || 'Admin';

    // Nav clicks
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.section);
            // Close mobile sidebar
            document.getElementById('admin-sidebar')?.classList.remove('open');
        });
    });

    // Mobile sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        document.getElementById('admin-sidebar')?.classList.toggle('open');
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', Auth.logout);

    // Product search
    document.getElementById('product-search')?.addEventListener('input', e => renderProductsTable(e.target.value));
    // Order search
    document.getElementById('order-search')?.addEventListener('input', e => renderOrdersTable(e.target.value));

    // Chart resize
    window.addEventListener('resize', () => {
        if (document.getElementById('section-dashboard')?.classList.contains('active')) drawRevenueChart();
    });

    // Start on dashboard
    navigateTo('dashboard');
});
