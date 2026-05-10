/**
 * Revival — Unified Product Data Store
 * Fetches from backend API with local fallback data.
 * The storefront always looks fully populated.
 */

/* ── Local Fallback Product Catalog ──────────────────────────── */
const FALLBACK_PRODUCTS = [
    {
        _id: 'fb-001',
        name: "California Dreamin' Denim Jacket",
        price: 78,
        originalPrice: 120,
        category: 'outerwear',
        era: '1970s',
        condition: 'Excellent',
        size: 'M',
        stock: 1,
        status: 'active',
        description: 'A beautifully broken-in vintage denim jacket adorned with hand-sewn patches and embroidered florals. The kind of piece that gets better with every wear.',
        details: ['100% cotton denim', 'Hand-applied vintage patches', 'Embroidered floral accents', 'Button-front closure', 'Two chest pockets'],
        image: 'images/vintage_denim_jacket.png',
        badge: 'Best Seller',
        badgeColor: 'bg-terracotta text-white',
    },
    {
        _id: 'fb-002',
        name: 'Heritage Leather Satchel',
        price: 95,
        originalPrice: 160,
        category: 'accessories',
        era: '1980s',
        condition: 'Very Good',
        size: 'One Size',
        stock: 1,
        status: 'active',
        description: 'A cognac leather satchel with brass hardware that has developed a rich patina over the decades.',
        details: ['Full-grain leather', 'Brass hardware with natural patina', 'Adjustable crossbody strap', 'Interior slip pocket', 'Handcrafted construction'],
        image: 'images/leather_satchel_bag.png',
        badge: 'Rare Find',
        badgeColor: 'bg-brand text-cream',
    },
    {
        _id: 'fb-003',
        name: 'Round Gold-Rimmed Sunglasses',
        price: 42,
        originalPrice: 75,
        category: 'accessories',
        era: '1960s',
        condition: 'Good',
        size: 'One Size',
        stock: 2,
        status: 'active',
        description: 'Iconic round-frame sunglasses with delicate gold rims and amber-tinted lenses. A timeless statement piece.',
        details: ['Gold-plated metal frame', 'Amber gradient lenses', 'UV protection', 'Engraved temple details', 'Includes vintage case'],
        image: 'images/vintage_sunglasses.png',
        badge: '',
        badgeColor: '',
    },
    {
        _id: 'fb-004',
        name: 'Sage Wool Cardigan',
        price: 56,
        originalPrice: 90,
        category: 'knitwear',
        era: '1990s',
        condition: 'Excellent',
        size: 'L',
        stock: 1,
        status: 'active',
        description: 'An oversized hand-knit wool cardigan in a soothing sage green. The ultimate layering piece for cooler months.',
        details: ['100% virgin wool', 'Hand-knit construction', 'Natural wood buttons', 'Deep patch pockets', 'Ribbed hem and cuffs'],
        image: 'images/wool_cardigan.png',
        badge: 'Just In',
        badgeColor: 'bg-sage text-white',
    },
    {
        _id: 'fb-005',
        name: 'Rugged Heritage Boots',
        price: 112,
        originalPrice: 185,
        category: 'footwear',
        era: '1970s',
        condition: 'Good — Beautifully Worn',
        size: '10 US',
        stock: 1,
        status: 'active',
        description: 'Well-loved leather work boots with a character you simply cannot buy new. Built to last another lifetime.',
        details: ['Full-grain leather upper', 'Goodyear welt construction', 'Lug rubber outsole', 'Padded collar', 'Resoleable'],
        image: 'images/leather_boots.png',
        badge: '',
        badgeColor: '',
    },
    {
        _id: 'fb-006',
        name: 'Floral Silk Scarf',
        price: 34,
        originalPrice: 55,
        category: 'accessories',
        era: '1980s',
        condition: 'Excellent',
        size: '90cm × 90cm',
        stock: 3,
        status: 'active',
        description: 'A luxurious silk scarf in warm terracotta with intricate floral motifs and a cream border.',
        details: ['100% pure silk twill', 'Hand-rolled edges', 'Floral & paisley print', 'Versatile styling options', 'Dry clean recommended'],
        image: 'images/silk_scarf.png',
        badge: 'Staff Pick',
        badgeColor: 'bg-terracotta text-white',
    },
    {
        _id: 'fb-007',
        name: 'Oversized Linen Blazer',
        price: 68,
        originalPrice: 110,
        category: 'outerwear',
        era: '1990s',
        condition: 'Very Good',
        size: 'M/L',
        stock: 1,
        status: 'active',
        description: 'A beautifully draped double-breasted linen blazer in warm tan. Effortless elegance for every season.',
        details: ['100% Italian linen', 'Double-breasted closure', 'Peak lapel design', 'Fully lined interior', 'Rolled cuff sleeves'],
        image: 'images/linen_blazer.png',
        badge: '',
        badgeColor: '',
    },
    {
        _id: 'fb-008',
        name: 'Hand-Painted Ceramic Vase',
        price: 48,
        originalPrice: 80,
        category: 'home',
        era: '1960s',
        condition: 'Excellent — Museum Quality',
        size: 'H: 28cm',
        stock: 2,
        status: 'active',
        description: 'A stunning hand-painted ceramic vase with traditional floral motifs in warm earth tones.',
        details: ['Hand-thrown ceramic', 'Hand-painted floral motifs', 'Glazed interior for water use', 'Signed by artisan', 'Eastern European origin'],
        image: 'images/ceramic_vase.png',
        badge: 'Rare Find',
        badgeColor: 'bg-brand text-cream',
    },
];

const FALLBACK_CATEGORIES = ['all', 'outerwear', 'accessories', 'knitwear', 'footwear', 'home'];

/* ── State ───────────────────────────────────────────────────── */
let _productCache = null;
let _useLocalFallback = false;

/* ── API-first with graceful fallback ────────────────────────── */
async function getActiveProducts() {
    if (_productCache) return _productCache;
    try {
        const res = await API.get('/products');
        if (res.error || !res.products || res.products.length === 0) throw new Error('empty');
        _productCache = res.products;
        return _productCache;
    } catch {
        _useLocalFallback = true;
        _productCache = FALLBACK_PRODUCTS;
        return _productCache;
    }
}

async function getCategories() {
    try {
        const res = await API.get('/products/categories');
        if (res.error || !res.categories || res.categories.length <= 1) throw new Error('empty');
        return res.categories;
    } catch {
        return FALLBACK_CATEGORIES;
    }
}

async function getProductsByCategory(category) {
    if (category === 'all') return await getActiveProducts();
    if (_useLocalFallback) {
        return FALLBACK_PRODUCTS.filter(p => p.category === category);
    }
    try {
        const res = await API.get(`/products?category=${encodeURIComponent(category)}`);
        if (res.error) throw new Error();
        return res.products || [];
    } catch {
        return FALLBACK_PRODUCTS.filter(p => p.category === category);
    }
}

async function getProductById(id) {
    // Check fallback first for fb-* IDs
    if (id.startsWith('fb-')) {
        return FALLBACK_PRODUCTS.find(p => p._id === id) || null;
    }
    try {
        const res = await API.get(`/products/${id}`);
        if (res.error) throw new Error();
        return res.product || null;
    } catch {
        return FALLBACK_PRODUCTS.find(p => p._id === id) || null;
    }
}

async function searchProducts(query) {
    const q = query.trim().toLowerCase();
    if (!q) return await getActiveProducts();
    if (_useLocalFallback) {
        return FALLBACK_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.era.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
    }
    try {
        const res = await API.get(`/products?search=${encodeURIComponent(q)}`);
        if (res.error) throw new Error();
        return res.products || [];
    } catch {
        return FALLBACK_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.era.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
    }
}
