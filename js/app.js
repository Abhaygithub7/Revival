/**
 * Revival — Main Application Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Page Loader ---
    const loader = document.getElementById('page-loader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 600);

    // --- Header scroll effect ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header?.classList.toggle('header-scrolled', window.scrollY > 20);
        document.getElementById('back-to-top')?.classList.toggle('visible', window.scrollY > 500);
    });

    // --- Mobile menu ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileBtn?.addEventListener('click', () => {
        mobileMenu?.classList.toggle('hidden');
        const icon = mobileBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // --- Search toggle ---
    document.getElementById('search-toggle')?.addEventListener('click', () => {
        const bar = document.getElementById('search-bar');
        bar?.classList.toggle('hidden');
        if (!bar?.classList.contains('hidden')) document.getElementById('search-input')?.focus();
    });

    // --- Cart sidebar ---
    document.getElementById('cart-toggle')?.addEventListener('click', () => Cart.openSidebar());
    document.getElementById('cart-overlay')?.addEventListener('click', () => Cart.closeSidebar());
    document.getElementById('cart-close')?.addEventListener('click', () => Cart.closeSidebar());
    Cart.updateCartCount();
    Cart.renderCartSidebar();

    // --- Smart account link: logged-in → account, else → login ---
    const accountLink = document.getElementById('header-account');
    if (accountLink && typeof CustomerAuth !== 'undefined' && CustomerAuth.isLoggedIn()) {
        accountLink.href = 'account.html';
        const indicator = document.getElementById('account-indicator');
        if (indicator) indicator.classList.remove('hidden');
    }

    // --- Render categories ---
    const catContainer = document.getElementById('category-filters');
    if (catContainer) {
        getCategories().forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `category-pill${cat === 'all' ? ' active' : ''}`;
            btn.textContent = cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
            btn.dataset.category = cat;
            btn.addEventListener('click', () => {
                catContainer.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderProducts(cat);
            });
            catContainer.appendChild(btn);
        });
    }

    // --- Render products ---
    function renderProducts(category = 'all') {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        const items = getProductsByCategory(category);
        grid.innerHTML = items.map(p => `
            <div class="product-card" data-product-id="${p.id}">
                ${p.badge ? `<span class="product-badge ${p.badgeColor}">${p.badge}</span>` : ''}
                <button class="wishlist-btn" onclick="event.stopPropagation(); this.classList.toggle('active'); this.querySelector('i').classList.toggle('fas'); this.querySelector('i').classList.toggle('far');">
                    <i class="far fa-heart"></i>
                </button>
                <div class="product-card-img">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </div>
                <div class="quick-view">
                    <button onclick="event.stopPropagation(); Cart.addItem(${p.id})" class="flex-1 py-2.5 bg-cream text-brand text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-white transition-colors">Add to Bag</button>
                    <button onclick="event.stopPropagation(); openModal(${p.id})" class="px-4 py-2.5 border border-cream/40 text-cream text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-cream/10 transition-colors">View</button>
                </div>
                <div class="p-4">
                    <p class="text-xs text-brand/50 uppercase tracking-wider mb-1">${p.era} · ${p.category}</p>
                    <h3 class="font-display text-base font-semibold text-brand leading-snug mb-2">${p.name}</h3>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-brand">$${p.price}</span>
                        <span class="text-sm text-brand/40 line-through">$${p.originalPrice}</span>
                        <span class="ml-auto text-xs font-semibold text-sage">${Math.round((1 - p.price/p.originalPrice)*100)}% off</span>
                    </div>
                </div>
            </div>
        `).join('');
        // click on card opens modal
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => openModal(Number(card.dataset.productId)));
        });
    }
    renderProducts();

    // --- Product Modal ---
    window.openModal = function(id) {
        const p = getProductById(id);
        if (!p) return;
        const modal = document.getElementById('product-modal');
        const content = document.getElementById('modal-body');
        if (!modal || !content) return;
        content.innerHTML = `
            <div class="grid md:grid-cols-2 gap-0">
                <div class="aspect-square md:aspect-auto overflow-hidden">
                    <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-6 md:p-10 flex flex-col justify-center">
                    <p class="text-xs text-brand/50 uppercase tracking-widest mb-2">${p.era} · ${p.category}</p>
                    <h2 class="font-display text-2xl md:text-3xl font-bold text-brand mb-3">${p.name}</h2>
                    <div class="flex items-center gap-3 mb-5">
                        <span class="text-2xl font-bold text-brand">$${p.price}</span>
                        <span class="text-lg text-brand/40 line-through">$${p.originalPrice}</span>
                        <span class="px-2 py-0.5 bg-sage/20 text-sage text-xs font-semibold rounded-full">${Math.round((1-p.price/p.originalPrice)*100)}% off</span>
                    </div>
                    <p class="text-sm text-brand/70 leading-relaxed mb-5">${p.description}</p>
                    <div class="space-y-2 mb-6">
                        <p class="text-xs font-semibold uppercase tracking-wider text-brand/50">Details</p>
                        <ul class="space-y-1.5">${p.details.map(d => `<li class="text-sm text-brand/60 flex items-start gap-2"><i class="fas fa-check text-sage text-[10px] mt-1.5"></i>${d}</li>`).join('')}</ul>
                    </div>
                    <div class="flex gap-2 text-xs text-brand/50 mb-6">
                        <span class="px-3 py-1.5 bg-brand/5 rounded-lg">Size: ${p.size}</span>
                        <span class="px-3 py-1.5 bg-brand/5 rounded-lg">Condition: ${p.condition}</span>
                    </div>
                    <button onclick="Cart.addItem(${p.id}); closeModal();" class="cta-btn w-full py-3.5 bg-brand text-cream font-semibold text-sm tracking-wide rounded-xl hover:bg-brand-dark transition-colors uppercase">Add to Bag — $${p.price}</button>
                </div>
            </div>
        `;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    window.closeModal = function() {
        document.getElementById('product-modal')?.classList.remove('open');
        document.body.style.overflow = '';
    };
    document.getElementById('product-modal')?.addEventListener('click', e => {
        if (e.target.id === 'product-modal') closeModal();
    });

    // --- Search ---
    function handleSearch(input) {
        const q = input?.value?.trim();
        if (!q) { renderProducts(); return; }
        const grid = document.getElementById('products-grid');
        const results = searchProducts(q);
        if (grid) {
            if (results.length === 0) {
                grid.innerHTML = `<div class="col-span-full text-center py-20"><i class="fas fa-search text-3xl text-brand/15 mb-4"></i><p class="font-display text-lg text-brand/50">No finds matching "${q}"</p></div>`;
            } else {
                // Reset active category
                document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-category="all"]')?.classList.add('active');
                grid.innerHTML = results.map(p => `
                    <div class="product-card" data-product-id="${p.id}">
                        ${p.badge ? `<span class="product-badge ${p.badgeColor}">${p.badge}</span>` : ''}
                        <button class="wishlist-btn" onclick="event.stopPropagation(); this.classList.toggle('active');"><i class="far fa-heart"></i></button>
                        <div class="product-card-img"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
                        <div class="quick-view">
                            <button onclick="event.stopPropagation(); Cart.addItem(${p.id})" class="flex-1 py-2.5 bg-cream text-brand text-xs font-semibold uppercase tracking-wider rounded-lg">Add to Bag</button>
                            <button onclick="event.stopPropagation(); openModal(${p.id})" class="px-4 py-2.5 border border-cream/40 text-cream text-xs font-semibold uppercase rounded-lg">View</button>
                        </div>
                        <div class="p-4">
                            <p class="text-xs text-brand/50 uppercase tracking-wider mb-1">${p.era} · ${p.category}</p>
                            <h3 class="font-display text-base font-semibold text-brand leading-snug mb-2">${p.name}</h3>
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-brand">$${p.price}</span>
                                <span class="text-sm text-brand/40 line-through">$${p.originalPrice}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                grid.querySelectorAll('.product-card').forEach(card => {
                    card.addEventListener('click', () => openModal(Number(card.dataset.productId)));
                });
            }
        }
    }
    document.getElementById('search-input')?.addEventListener('input', e => handleSearch(e.target));
    document.getElementById('mobile-search-input')?.addEventListener('input', e => handleSearch(e.target));

    // --- Scroll reveal ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children').forEach(el => observer.observe(el));

    // --- Stats counter animation ---
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                let current = 0;
                const step = Math.ceil(target / 60);
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) { current = target; clearInterval(timer); }
                    el.textContent = current.toLocaleString() + suffix;
                }, 25);
                statObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-number').forEach(el => statObserver.observe(el));

    // --- Back to top ---
    document.getElementById('back-to-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // --- Newsletter form ---
    document.getElementById('newsletter-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const input = e.target.querySelector('input');
        if (input?.value) {
            Cart.showToast('Welcome to the Revival community!');
            input.value = '';
        }
    });
});
