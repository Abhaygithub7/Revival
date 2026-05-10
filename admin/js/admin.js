/**
 * Revival Admin — Dashboard Controller (v2)
 * Shares data with storefront via localStorage keys.
 */
const ADMIN_PRODUCTS_KEY = 'revival_admin_products';
const ADMIN_ORDERS_KEY = 'revival_admin_orders';
const ADMIN_SETTINGS_KEY = 'revival_admin_settings';
const CUSTOMER_USERS_KEY = 'revival_customer_users';

function getDefaultOrders() {
    return [
        { id:'ORD-1001', customer:'Sarah Mitchell', email:'sarah@email.com', items:[{productId:1,qty:1}], total:78, status:'delivered', date:'2026-05-08', address:'123 Oak St, Portland, OR' },
        { id:'ORD-1002', customer:'James Kim', email:'james@email.com', items:[{productId:2,qty:1},{productId:6,qty:1}], total:129, status:'shipped', date:'2026-05-09', address:'456 Pine Ave, Seattle, WA' },
        { id:'ORD-1003', customer:'Amara Lee', email:'amara@email.com', items:[{productId:4,qty:1}], total:56, status:'processing', date:'2026-05-09', address:'789 Elm Blvd, Austin, TX' },
        { id:'ORD-1004', customer:'David Chen', email:'david@email.com', items:[{productId:5,qty:1},{productId:3,qty:1}], total:154, status:'pending', date:'2026-05-10', address:'321 Maple Dr, Denver, CO' },
        { id:'ORD-1005', customer:'Emma Watson', email:'emma@email.com', items:[{productId:8,qty:2}], total:96, status:'pending', date:'2026-05-10', address:'555 Cedar Ln, Brooklyn, NY' },
    ];
}
function getDefaultSettings() {
    return { storeName:'Revival', tagline:'Curated Thrift', currency:'USD', taxRate:8.5, freeShippingThreshold:100, flatShippingRate:8.99 };
}

/* DATA ACCESS — shared with storefront via same localStorage keys */
function loadProducts() { try { return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || []; } catch { return []; } }
function saveProducts(p) { localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(p)); }
function loadOrders() { try { return JSON.parse(localStorage.getItem(ADMIN_ORDERS_KEY)) || getDefaultOrders(); } catch { return getDefaultOrders(); } }
function saveOrders(o) { localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(o)); }
function loadSettings() { try { return JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY)) || getDefaultSettings(); } catch { return getDefaultSettings(); } }
function saveSettings(s) { localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(s)); }
function loadRegisteredUsers() { try { return JSON.parse(localStorage.getItem(CUSTOMER_USERS_KEY)) || []; } catch { return []; } }

if (!localStorage.getItem(ADMIN_ORDERS_KEY)) saveOrders(getDefaultOrders());

/** Resolve image path for admin context (images stored as 'images/...' for storefront) */
function adminImg(path) {
    if (!path) return '../images/vintage_denim_jacket.png';
    if (path.startsWith('../')) return path;
    return '../' + path;
}

/* TOAST */
function showAdminToast(msg, type='success') {
    const c = document.getElementById('admin-toast-container');
    const icons = { success:'fa-check-circle text-success', error:'fa-exclamation-circle text-danger', info:'fa-info-circle' };
    const t = document.createElement('div');
    t.className = 'admin-toast';
    t.innerHTML = `<i class="fas ${icons[type]||icons.info}" style="color:${type==='success'?'var(--success)':type==='error'?'var(--danger)':'var(--info)'}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
}

/* CLOCK */
function updateClock() {
    const el = document.getElementById('current-time');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}

/* NAVIGATION */
const sectionTitles = { dashboard:'Dashboard', products:'Products', orders:'Orders', customers:'Customers', analytics:'Analytics', inventory:'Inventory', settings:'Settings' };

function navigateTo(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
    document.getElementById('topbar-title').textContent = sectionTitles[section] || 'Dashboard';
    const renders = { dashboard:renderDashboard, products:renderProductsTable, orders:renderOrdersTable, customers:renderCustomers, analytics:renderAnalytics, inventory:renderInventory, settings:renderSettings };
    renders[section]?.();
}

/* DASHBOARD */
function renderDashboard() {
    const products = loadProducts(), orders = loadOrders();
    const revenue = orders.reduce((s,o) => s+o.total, 0);
    const activeProducts = products.filter(p => p.status==='active').length;
    const customers = [...new Set(orders.map(o => o.email))].length;
    const pending = orders.filter(o => o.status==='pending'||o.status==='processing').length;

    document.getElementById('stat-revenue').textContent = `$${revenue.toLocaleString()}`;
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-products').textContent = activeProducts;
    document.getElementById('stat-customers').textContent = customers;
    document.getElementById('stat-revenue-change').innerHTML = `<i class="fas fa-arrow-up" style="font-size:10px;"></i> +12.5%`;
    document.getElementById('stat-orders-change').textContent = `${pending} pending`;

    // Nav badge
    const badge = document.getElementById('nav-orders-badge');
    if (badge) { if (pending > 0) { badge.textContent = pending; badge.style.display = ''; } else { badge.style.display = 'none'; } }

    const tbody = document.getElementById('recent-orders-body');
    tbody.innerHTML = orders.slice(0,5).map(o => `
        <tr>
            <td><span class="font-mono text-xs">${o.id}</span></td>
            <td class="fw-500">${o.customer}</td>
            <td class="fw-600">$${o.total}</td>
            <td><span class="badge badge-${getStatusBadge(o.status)}">${o.status}</span></td>
            <td class="text-xs text-muted">${o.date}</td>
        </tr>
    `).join('');
    drawRevenueChart();
}

function getStatusBadge(s) { return {pending:'warning',processing:'info',shipped:'info',delivered:'success',cancelled:'danger'}[s]||'neutral'; }

function drawRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio||1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width*dpr; canvas.height = rect.height*dpr;
    ctx.scale(dpr,dpr);
    const w=rect.width, h=rect.height;
    const data = [420,680,590,820,750,960,1100,890,1250,1080,1340,1500];
    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const max = Math.max(...data)*1.15;
    const padL=50, padR=20, padT=20, padB=40;
    const chartW=w-padL-padR, chartH=h-padT-padB;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
        const y=padT+(chartH/4)*i;
        ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();
        ctx.fillStyle='#5a5a7a';ctx.font='10px Inter';ctx.textAlign='right';
        ctx.fillText('$'+Math.round(max-(max/4)*i),padL-8,y+4);
    }
    const barW=chartW/data.length*0.55, gap=chartW/data.length;
    data.forEach((val,i)=>{
        const barH=(val/max)*chartH;
        const x=padL+gap*i+(gap-barW)/2, y=padT+chartH-barH;
        const grad=ctx.createLinearGradient(x,y,x,padT+chartH);
        grad.addColorStop(0,'#C17D5B');grad.addColorStop(1,'rgba(193,125,91,0.1)');
        ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(x,y,barW,barH,[5,5,0,0]);ctx.fill();
        ctx.fillStyle='#5a5a7a';ctx.font='10px Inter';ctx.textAlign='center';
        ctx.fillText(labels[i],padL+gap*i+gap/2,h-12);
    });
}

/* PRODUCTS */
function renderProductsTable(filter='') {
    let products = loadProducts();
    if(filter) products = products.filter(p=>p.name.toLowerCase().includes(filter.toLowerCase())||p.category.includes(filter.toLowerCase()));
    document.getElementById('products-count').textContent = `${products.length} products`;
    document.getElementById('products-table-body').innerHTML = products.map(p=>`
        <tr>
            <td><div style="display:flex;align-items:center;gap:14px;">
                <img src="${adminImg(p.image)}" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover;border:1px solid var(--border);">
                <div><div class="fw-500">${p.name}</div><div class="text-xs text-muted">${p.era||''} · ${p.category}</div></div>
            </div></td>
            <td class="fw-600">$${p.price}</td>
            <td class="text-muted">$${p.originalPrice||''}</td>
            <td>${p.stock}</td>
            <td><span class="badge badge-${p.status==='active'?'success':p.status==='sold'?'danger':'neutral'}">${p.status}</span></td>
            <td><div style="display:flex;gap:6px;">
                <button class="btn btn-ghost btn-sm" onclick="openEditProduct(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`).join('');
}

function openAddProduct() {
    document.getElementById('product-modal-title').textContent='Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-form').dataset.editId='';
    openModal('product-modal');
}
function openEditProduct(id) {
    const p=loadProducts().find(x=>x.id===id); if(!p) return;
    document.getElementById('product-modal-title').textContent='Edit Product';
    document.getElementById('pf-name').value=p.name;
    document.getElementById('pf-price').value=p.price;
    document.getElementById('pf-original-price').value=p.originalPrice;
    document.getElementById('pf-category').value=p.category;
    document.getElementById('pf-era').value=p.era;
    document.getElementById('pf-size').value=p.size;
    document.getElementById('pf-stock').value=p.stock;
    document.getElementById('pf-status').value=p.status;
    document.getElementById('product-form').dataset.editId=id;
    openModal('product-modal');
}
function saveProduct() {
    const form=document.getElementById('product-form');
    const editId=form.dataset.editId?Number(form.dataset.editId):null;
    const data={
        name:document.getElementById('pf-name').value,
        price:Number(document.getElementById('pf-price').value),
        originalPrice:Number(document.getElementById('pf-original-price').value),
        category:document.getElementById('pf-category').value,
        era:document.getElementById('pf-era').value,
        size:document.getElementById('pf-size').value,
        stock:Number(document.getElementById('pf-stock').value),
        status:document.getElementById('pf-status').value,
    };
    if(!data.name||!data.price){showAdminToast('Please fill required fields','error');return;}
    const products=loadProducts();
    if(editId){
        const idx=products.findIndex(p=>p.id===editId);
        // Merge: preserve existing fields like image, description, details, badge
        if(idx!==-1) products[idx]={...products[idx],...data};
    } else {
        data.id=Math.max(0,...products.map(p=>p.id))+1;
        // New products: use storefront-relative image path
        data.image='images/vintage_denim_jacket.png';
        data.condition='Good';
        data.description='';
        data.details=[];
        data.badge=null;
        data.badgeColor=null;
        products.push(data);
    }
    saveProducts(products);closeModal('product-modal');renderProductsTable();
    showAdminToast(editId?'Product updated — live on storefront':'Product added — now live on storefront');
}
function deleteProduct(id) {
    if(!confirm('Delete this product?')) return;
    saveProducts(loadProducts().filter(p=>p.id!==id));renderProductsTable();showAdminToast('Product deleted','info');
}

/* ORDERS */
function renderOrdersTable(filter='') {
    let orders=loadOrders();
    if(filter) orders=orders.filter(o=>o.id.toLowerCase().includes(filter.toLowerCase())||o.customer.toLowerCase().includes(filter.toLowerCase())||o.status===filter.toLowerCase());
    document.getElementById('orders-count').textContent=`${orders.length} orders`;
    document.getElementById('orders-table-body').innerHTML=orders.map(o=>`
        <tr>
            <td><span class="font-mono text-xs">${o.id}</span></td>
            <td><div class="fw-500">${o.customer}</div><div class="text-xs text-muted">${o.email}</div></td>
            <td>${o.items.reduce((s,i)=>s+i.qty,0)} item(s)</td>
            <td class="fw-600">$${o.total}</td>
            <td><span class="badge badge-${getStatusBadge(o.status)}">${o.status}</span></td>
            <td class="text-xs text-muted">${o.date}</td>
            <td><select class="form-select" style="width:130px;padding:7px 12px;font-size:11px;" onchange="updateOrderStatus('${o.id}',this.value)">
                ${['pending','processing','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
            </select></td>
        </tr>`).join('');
}
function updateOrderStatus(orderId,newStatus) {
    const orders=loadOrders(),order=orders.find(o=>o.id===orderId);
    if(order){order.status=newStatus;saveOrders(orders);renderOrdersTable();showAdminToast(`Order ${orderId} → ${newStatus}`);}
}

/* CUSTOMERS — merges registered users + order-derived customers */
function renderCustomers() {
    const orders=loadOrders(), map={};
    // Build from orders
    orders.forEach(o=>{
        if(!map[o.email]) map[o.email]={name:o.customer,email:o.email,orders:0,totalSpent:0,lastOrder:o.date,registered:false,joinDate:null};
        map[o.email].orders++;map[o.email].totalSpent+=o.total;
        if(o.date>map[o.email].lastOrder) map[o.email].lastOrder=o.date;
    });
    // Merge registered users (even if they haven't ordered yet)
    const regUsers=loadRegisteredUsers();
    regUsers.forEach(u=>{
        if(!map[u.email]) map[u.email]={name:u.name,email:u.email,orders:0,totalSpent:0,lastOrder:null,registered:true,joinDate:u.createdAt};
        else { map[u.email].registered=true; map[u.email].joinDate=u.createdAt; }
    });
    const customers=Object.values(map).sort((a,b)=>b.totalSpent-a.totalSpent);
    document.getElementById('customers-table-body').innerHTML=customers.map(c=>`
        <tr>
            <td><div style="display:flex;align-items:center;gap:12px;">
                <div style="width:38px;height:38px;border-radius:50%;background:var(--terracotta-glow);display:flex;align-items:center;justify-content:center;color:var(--terracotta);font-weight:700;font-size:14px;">${c.name.charAt(0)}</div>
                <div><div class="fw-500">${c.name}</div><div class="text-xs text-muted">${c.email}</div></div>
            </div></td>
            <td>${c.orders}</td>
            <td class="fw-600">${c.totalSpent?'$'+c.totalSpent:'—'}</td>
            <td class="text-xs text-muted">${c.lastOrder||'No orders yet'}</td>
            <td>${c.registered?'<span class="badge badge-success"><span class="status-dot online" style="width:6px;height:6px;"></span> Registered</span>':'<span class="badge badge-neutral">Guest</span>'}</td>
        </tr>`).join('');
}

/* ANALYTICS */
function renderAnalytics() {
    const orders=loadOrders(), products=loadProducts();
    const revenue=orders.reduce((s,o)=>s+o.total,0);
    const aov=orders.length?revenue/orders.length:0;
    const itemsSold=orders.reduce((s,o)=>s+o.items.reduce((ss,i)=>ss+i.qty,0),0);
    document.getElementById('stat-aov').textContent='$'+Math.round(aov);
    document.getElementById('stat-items-sold').textContent=itemsSold;

    // Top products
    const productSales={};
    orders.forEach(o=>o.items.forEach(i=>{
        if(!productSales[i.productId]) productSales[i.productId]={qty:0,revenue:0};
        productSales[i.productId].qty+=i.qty;
        const p=products.find(x=>x.id===i.productId);
        if(p) productSales[i.productId].revenue+=p.price*i.qty;
    }));
    const topList=document.getElementById('top-products-list');
    const sorted=Object.entries(productSales).sort((a,b)=>b[1].revenue-a[1].revenue).slice(0,5);
    const maxRev=sorted.length?sorted[0][1].revenue:1;
    topList.innerHTML=sorted.map(([pid,data])=>{
        const p=products.find(x=>x.id===Number(pid));
        const pct=Math.round(data.revenue/maxRev*100);
        return `<div style="display:flex;align-items:center;gap:14px;">
            <img src="${adminImg(p?p.image:null)}" style="width:40px;height:40px;border-radius:10px;object-fit:cover;border:1px solid var(--border);">
            <div style="flex:1;min-width:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span class="fw-500 text-sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p?p.name:'Unknown'}</span>
                    <span class="fw-600 text-sm text-terracotta">$${data.revenue}</span>
                </div>
                <div style="height:6px;background:var(--bg-hover);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--terracotta),#d4936e);border-radius:3px;transition:width 0.6s ease;"></div>
                </div>
            </div>
        </div>`;
    }).join('');

    drawCategoryChart();
}

function drawCategoryChart() {
    const canvas=document.getElementById('category-chart');
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const dpr=window.devicePixelRatio||1;
    const rect=canvas.getBoundingClientRect();
    canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;
    ctx.scale(dpr,dpr);
    const w=rect.width,h=rect.height;
    const products=loadProducts();
    const cats={};
    products.forEach(p=>{cats[p.category]=(cats[p.category]||0)+1;});
    const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
    const colors=['#C17D5B','#60a5fa','#4ade80','#fbbf24','#a78bfa','#f87171'];
    const total=entries.reduce((s,e)=>s+e[1],0);
    const cx=w*0.32,cy=h/2,r=Math.min(cx-20,cy-20,90);

    ctx.clearRect(0,0,w,h);
    let angle=-Math.PI/2;
    entries.forEach(([cat,count],i)=>{
        const slice=(count/total)*Math.PI*2;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();
        ctx.fillStyle=colors[i%colors.length];ctx.fill();
        angle+=slice;
    });
    // Inner circle (donut)
    ctx.beginPath();ctx.arc(cx,cy,r*0.58,0,Math.PI*2);
    ctx.fillStyle='var(--bg-secondary)';ctx.fill();
    // Center text
    ctx.fillStyle='#eaeaf4';ctx.font='bold 22px Inter';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(total,cx,cy-8);
    ctx.fillStyle='#5a5a7a';ctx.font='11px Inter';ctx.fillText('items',cx,cy+12);

    // Legend
    const lx=w*0.62,ly=h/2-entries.length*16;
    entries.forEach(([cat,count],i)=>{
        const y=ly+i*34;
        ctx.fillStyle=colors[i%colors.length];
        ctx.beginPath();ctx.roundRect(lx,y,14,14,[3]);ctx.fill();
        ctx.fillStyle='#eaeaf4';ctx.font='13px Inter';ctx.textAlign='left';
        ctx.fillText(cat.charAt(0).toUpperCase()+cat.slice(1),lx+22,y+11);
        ctx.fillStyle='#5a5a7a';ctx.font='12px Inter';
        ctx.fillText(`${count} (${Math.round(count/total*100)}%)`,lx+22+ctx.measureText(cat.charAt(0).toUpperCase()+cat.slice(1)).width+12,y+11);
    });
}

/* INVENTORY */
function renderInventory() {
    const products=loadProducts();
    const total=products.length;
    const inStock=products.filter(p=>p.stock>1).length;
    const low=products.filter(p=>p.stock===1).length;
    const out=products.filter(p=>p.stock===0).length;
    document.getElementById('inv-total').textContent=total;
    document.getElementById('inv-instock').textContent=inStock;
    document.getElementById('inv-low').textContent=low;
    document.getElementById('inv-out').textContent=out;

    document.getElementById('inventory-table-body').innerHTML=products.map(p=>{
        const stockStatus=p.stock===0?'danger':p.stock===1?'warning':'success';
        const stockLabel=p.stock===0?'Out of Stock':p.stock===1?'Low Stock':'In Stock';
        return `<tr>
            <td><div style="display:flex;align-items:center;gap:12px;">
                <img src="${adminImg(p.image)}" style="width:40px;height:40px;border-radius:10px;object-fit:cover;border:1px solid var(--border);">
                <span class="fw-500">${p.name}</span>
            </div></td>
            <td class="text-muted">${p.category}</td>
            <td class="fw-600">${p.stock}</td>
            <td><span class="badge badge-${stockStatus}">${stockLabel}</span></td>
            <td class="fw-500">$${(p.price*p.stock).toLocaleString()}</td>
        </tr>`;
    }).join('');
}

/* SETTINGS */
function renderSettings() {
    const s=loadSettings();
    document.getElementById('sf-store-name').value=s.storeName;
    document.getElementById('sf-tagline').value=s.tagline;
    document.getElementById('sf-currency').value=s.currency;
    document.getElementById('sf-tax-rate').value=s.taxRate;
    document.getElementById('sf-free-shipping').value=s.freeShippingThreshold;
    document.getElementById('sf-flat-shipping').value=s.flatShippingRate;
}
function saveSettingsForm() {
    saveSettings({
        storeName:document.getElementById('sf-store-name').value,
        tagline:document.getElementById('sf-tagline').value,
        currency:document.getElementById('sf-currency').value,
        taxRate:Number(document.getElementById('sf-tax-rate').value),
        freeShippingThreshold:Number(document.getElementById('sf-free-shipping').value),
        flatShippingRate:Number(document.getElementById('sf-flat-shipping').value),
    });
    showAdminToast('Settings saved');
}

/* MODAL HELPERS */
function openModal(id){document.getElementById(id)?.classList.add('open');}
function closeModal(id){document.getElementById(id)?.classList.remove('open');}

/* INIT */
document.addEventListener('DOMContentLoaded',()=>{
    const user=Auth.check(); if(!user) return;
    document.getElementById('admin-user-name').textContent=user.name||'Admin';
    const sub=document.getElementById('topbar-subtitle');
    if(sub) sub.textContent=`Welcome back, ${user.name||'Admin'}`;

    // Clock
    updateClock(); setInterval(updateClock,30000);

    // Nav
    document.querySelectorAll('.nav-item[data-section]').forEach(item=>{
        item.addEventListener('click',e=>{e.preventDefault();navigateTo(item.dataset.section);document.getElementById('admin-sidebar')?.classList.remove('open');});
    });

    // Mobile
    document.getElementById('sidebar-toggle')?.addEventListener('click',()=>document.getElementById('admin-sidebar')?.classList.toggle('open'));

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click',Auth.logout);

    // Search
    document.getElementById('product-search')?.addEventListener('input',e=>renderProductsTable(e.target.value));
    document.getElementById('order-search')?.addEventListener('input',e=>renderOrdersTable(e.target.value));

    // Chart resize
    window.addEventListener('resize',()=>{
        if(document.getElementById('section-dashboard')?.classList.contains('active')) drawRevenueChart();
        if(document.getElementById('section-analytics')?.classList.contains('active')) drawCategoryChart();
    });

    navigateTo('dashboard');
});
