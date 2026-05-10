/**
 * Revival — Unified Product Data Store
 * Single source of truth: localStorage key 'revival_admin_products'
 * Both the customer storefront and admin dashboard read/write from here.
 */

const PRODUCTS_KEY = 'revival_admin_products';

/** Default seed catalog — used only on very first visit */
const DEFAULT_PRODUCTS = [
    {
        id: 1, name: "California Dreamin' Denim Jacket", price: 78, originalPrice: 120,
        category: "outerwear", era: "1970s", condition: "Excellent", size: "M",
        stock: 1, status: "active",
        description: "A beautifully broken-in vintage denim jacket adorned with hand-sewn patches and embroidered florals. Each patch tells a story — from 'Peace & Love' to 'National Parks'. This is a genuine piece of Americana.",
        details: ["100% cotton denim","Hand-applied vintage patches","Embroidered floral accents","Button-front closure","Two chest pockets"],
        image: "images/vintage_denim_jacket.png",
        badge: "Best Seller", badgeColor: "bg-terracotta text-white"
    },
    {
        id: 2, name: "Heritage Leather Satchel", price: 95, originalPrice: 160,
        category: "accessories", era: "1980s", condition: "Very Good", size: "One Size",
        stock: 1, status: "active",
        description: "A cognac leather satchel with brass hardware that has developed a rich patina over the decades. Features a turn-lock clasp, twin buckle straps, and a detachable crossbody strap. The kind of bag that only gets better with time.",
        details: ["Full-grain leather","Brass hardware with natural patina","Adjustable crossbody strap","Interior slip pocket","Handcrafted construction"],
        image: "images/leather_satchel_bag.png",
        badge: "Rare Find", badgeColor: "bg-brand text-cream"
    },
    {
        id: 3, name: "Round Gold-Rimmed Sunglasses", price: 42, originalPrice: 75,
        category: "accessories", era: "1960s", condition: "Good", size: "One Size",
        stock: 2, status: "active",
        description: "Iconic round-frame sunglasses with delicate gold rims and amber-tinted lenses. Reminiscent of a bygone era of free spirits and open roads. Lightweight and surprisingly comfortable.",
        details: ["Gold-plated metal frame","Amber gradient lenses","UV protection","Engraved temple details","Includes vintage case"],
        image: "images/vintage_sunglasses.png",
        badge: null, badgeColor: null
    },
    {
        id: 4, name: "Sage Wool Cardigan", price: 56, originalPrice: 90,
        category: "knitwear", era: "1990s", condition: "Excellent", size: "L",
        stock: 1, status: "active",
        description: "An oversized hand-knit wool cardigan in a soothing sage green. Features wooden buttons, ribbed cuffs, and deep patch pockets perfect for chilly mornings. Cozy, warm, and endlessly versatile.",
        details: ["100% virgin wool","Hand-knit construction","Natural wood buttons","Deep patch pockets","Ribbed hem and cuffs"],
        image: "images/wool_cardigan.png",
        badge: "Just In", badgeColor: "bg-sage text-white"
    },
    {
        id: 5, name: "Rugged Heritage Boots", price: 112, originalPrice: 185,
        category: "footwear", era: "1970s", condition: "Good — Beautifully Worn", size: "10 US",
        stock: 1, status: "active",
        description: "Well-loved leather work boots with a character you simply cannot buy new. The distressed leather tells of adventures had, and the Goodyear-welted sole means many more to come. A true survivor.",
        details: ["Full-grain leather upper","Goodyear welt construction","Lug rubber outsole","Padded collar","Resoleable"],
        image: "images/leather_boots.png",
        badge: null, badgeColor: null
    },
    {
        id: 6, name: "Floral Silk Scarf", price: 34, originalPrice: 55,
        category: "accessories", era: "1980s", condition: "Excellent", size: "90cm × 90cm",
        stock: 3, status: "active",
        description: "A luxurious silk scarf in warm terracotta with intricate floral motifs and a cream border. The kind of accessory that transforms an entire outfit. Can be worn as a headscarf, neck wrap, or bag accent.",
        details: ["100% pure silk twill","Hand-rolled edges","Floral & paisley print","Versatile styling options","Dry clean recommended"],
        image: "images/silk_scarf.png",
        badge: "Staff Pick", badgeColor: "bg-terracotta text-white"
    },
    {
        id: 7, name: "Oversized Linen Blazer", price: 68, originalPrice: 110,
        category: "outerwear", era: "1990s", condition: "Very Good", size: "M/L",
        stock: 1, status: "active",
        description: "A beautifully draped double-breasted linen blazer in warm tan. The oversized silhouette is effortlessly chic — perfect thrown over a simple tee or a flowy dress. Timeless tailoring at its finest.",
        details: ["100% Italian linen","Double-breasted closure","Peak lapel design","Fully lined interior","Rolled cuff sleeves"],
        image: "images/linen_blazer.png",
        badge: null, badgeColor: null
    },
    {
        id: 8, name: "Hand-Painted Ceramic Vase", price: 48, originalPrice: 80,
        category: "home", era: "1960s", condition: "Excellent — Museum Quality", size: "H: 28cm",
        stock: 2, status: "active",
        description: "A stunning hand-painted ceramic vase with traditional floral motifs in warm earth tones. Each brushstroke is a testament to artisan craftsmanship. Perfect as a centerpiece with dried flowers or standing alone as art.",
        details: ["Hand-thrown ceramic","Hand-painted floral motifs","Glazed interior for water use","Signed by artisan","Eastern European origin"],
        image: "images/ceramic_vase.png",
        badge: "Rare Find", badgeColor: "bg-brand text-cream"
    }
];

// Seed localStorage on first visit if empty
if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
}

/**
 * Load live products from localStorage (shared with admin)
 * Storefront only shows 'active' products with stock > 0
 */
function _loadAllProducts() {
    try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || DEFAULT_PRODUCTS; }
    catch { return DEFAULT_PRODUCTS; }
}

/** Get all storefront-visible products (active + in stock) */
function getActiveProducts() {
    return _loadAllProducts().filter(p => p.status === 'active' && p.stock > 0);
}

/** Get all unique categories from active products */
function getCategories() {
    const cats = [...new Set(getActiveProducts().map(p => p.category))];
    return ['all', ...cats];
}

/** Get active products by category */
function getProductsByCategory(category) {
    const products = getActiveProducts();
    if (category === 'all') return products;
    return products.filter(p => p.category === category);
}

/** Get a single product by ID (from full catalog, needed for cart/orders) */
function getProductById(id) {
    return _loadAllProducts().find(p => p.id === id);
}

/** Search active products by query */
function searchProducts(query) {
    const q = query.toLowerCase().trim();
    if (!q) return getActiveProducts();
    return getActiveProducts().filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.era.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
}

// Backward compat: expose PRODUCTS as a getter for any code referencing it
const PRODUCTS = getActiveProducts();
