require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

const products = [
    { name:"California Dreamin' Denim Jacket", price:78, originalPrice:120, category:"outerwear", era:"1970s", condition:"Excellent", size:"M", stock:1, status:"active", description:"A beautifully broken-in vintage denim jacket adorned with hand-sewn patches and embroidered florals.", details:["100% cotton denim","Hand-applied vintage patches","Embroidered floral accents","Button-front closure","Two chest pockets"], image:"images/vintage_denim_jacket.png", badge:"Best Seller", badgeColor:"bg-terracotta text-white" },
    { name:"Heritage Leather Satchel", price:95, originalPrice:160, category:"accessories", era:"1980s", condition:"Very Good", size:"One Size", stock:1, status:"active", description:"A cognac leather satchel with brass hardware that has developed a rich patina over the decades.", details:["Full-grain leather","Brass hardware with natural patina","Adjustable crossbody strap","Interior slip pocket","Handcrafted construction"], image:"images/leather_satchel_bag.png", badge:"Rare Find", badgeColor:"bg-brand text-cream" },
    { name:"Round Gold-Rimmed Sunglasses", price:42, originalPrice:75, category:"accessories", era:"1960s", condition:"Good", size:"One Size", stock:2, status:"active", description:"Iconic round-frame sunglasses with delicate gold rims and amber-tinted lenses.", details:["Gold-plated metal frame","Amber gradient lenses","UV protection","Engraved temple details","Includes vintage case"], image:"images/vintage_sunglasses.png" },
    { name:"Sage Wool Cardigan", price:56, originalPrice:90, category:"knitwear", era:"1990s", condition:"Excellent", size:"L", stock:1, status:"active", description:"An oversized hand-knit wool cardigan in a soothing sage green.", details:["100% virgin wool","Hand-knit construction","Natural wood buttons","Deep patch pockets","Ribbed hem and cuffs"], image:"images/wool_cardigan.png", badge:"Just In", badgeColor:"bg-sage text-white" },
    { name:"Rugged Heritage Boots", price:112, originalPrice:185, category:"footwear", era:"1970s", condition:"Good — Beautifully Worn", size:"10 US", stock:1, status:"active", description:"Well-loved leather work boots with a character you simply cannot buy new.", details:["Full-grain leather upper","Goodyear welt construction","Lug rubber outsole","Padded collar","Resoleable"], image:"images/leather_boots.png" },
    { name:"Floral Silk Scarf", price:34, originalPrice:55, category:"accessories", era:"1980s", condition:"Excellent", size:"90cm × 90cm", stock:3, status:"active", description:"A luxurious silk scarf in warm terracotta with intricate floral motifs and a cream border.", details:["100% pure silk twill","Hand-rolled edges","Floral & paisley print","Versatile styling options","Dry clean recommended"], image:"images/silk_scarf.png", badge:"Staff Pick", badgeColor:"bg-terracotta text-white" },
    { name:"Oversized Linen Blazer", price:68, originalPrice:110, category:"outerwear", era:"1990s", condition:"Very Good", size:"M/L", stock:1, status:"active", description:"A beautifully draped double-breasted linen blazer in warm tan.", details:["100% Italian linen","Double-breasted closure","Peak lapel design","Fully lined interior","Rolled cuff sleeves"], image:"images/linen_blazer.png" },
    { name:"Hand-Painted Ceramic Vase", price:48, originalPrice:80, category:"home", era:"1960s", condition:"Excellent — Museum Quality", size:"H: 28cm", stock:2, status:"active", description:"A stunning hand-painted ceramic vase with traditional floral motifs in warm earth tones.", details:["Hand-thrown ceramic","Hand-painted floral motifs","Glazed interior for water use","Signed by artisan","Eastern European origin"], image:"images/ceramic_vase.png", badge:"Rare Find", badgeColor:"bg-brand text-cream" },
];

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany(), Settings.deleteMany()]);
    console.log('✓ Cleared existing data');

    // Create admin user
    const admin = await User.create({ name: 'Admin', email: 'admin@revival.com', password: 'revival2024', role: 'admin' });
    console.log('✓ Admin user created (admin@revival.com / revival2024)');

    // Create demo customer
    const customer = await User.create({ name: 'Sarah Mitchell', email: 'sarah@email.com', password: 'customer123', role: 'customer' });
    console.log('✓ Demo customer created (sarah@email.com / customer123)');

    // Create products
    const createdProducts = await Product.insertMany(products);
    console.log(`✓ ${createdProducts.length} products seeded`);

    // Create demo orders
    await Order.create([
        { orderId:'ORD-1001', user:customer._id, customerName:'Sarah Mitchell', customerEmail:'sarah@email.com', items:[{productId:createdProducts[0]._id, name:createdProducts[0].name, price:78, qty:1}], subtotal:78, tax:6.63, shippingCost:8.99, total:93.62, status:'delivered', shippingAddress:{name:'Sarah Mitchell',address:'123 Oak St',city:'Portland',state:'OR',zip:'97201',country:'US'}, payment:{method:'Visa',last4:'4242'} },
        { orderId:'ORD-1002', user:null, customerName:'James Kim', customerEmail:'james@email.com', items:[{productId:createdProducts[1]._id, name:createdProducts[1].name, price:95, qty:1},{productId:createdProducts[5]._id, name:createdProducts[5].name, price:34, qty:1}], subtotal:129, tax:10.97, shippingCost:0, total:139.97, status:'shipped', shippingAddress:{name:'James Kim',address:'456 Pine Ave',city:'Seattle',state:'WA',zip:'98101',country:'US'}, payment:{method:'Card',last4:'1234'} },
        { orderId:'ORD-1003', user:null, customerName:'Amara Lee', customerEmail:'amara@email.com', items:[{productId:createdProducts[3]._id, name:createdProducts[3].name, price:56, qty:1}], subtotal:56, tax:4.76, shippingCost:8.99, total:69.75, status:'processing', shippingAddress:{name:'Amara Lee',address:'789 Elm Blvd',city:'Austin',state:'TX',zip:'73301',country:'US'}, payment:{method:'Visa',last4:'5678'} },
    ]);
    console.log('✓ 3 demo orders seeded');

    // Create default settings
    await Settings.create({ storeName:'Revival', tagline:'Curated Thrift', currency:'USD', taxRate:8.5, freeShippingThreshold:100, flatShippingRate:8.99 });
    console.log('✓ Default settings created');

    console.log('\n🎉 Seed complete!');
    process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
