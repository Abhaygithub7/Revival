const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    category: {
        type: String,
        required: true,
        enum: ['outerwear', 'accessories', 'knitwear', 'footwear', 'home'],
        lowercase: true,
    },
    era: { type: String, trim: true },
    condition: { type: String, default: 'Good' },
    size: { type: String, trim: true },
    stock: { type: Number, default: 1, min: 0 },
    status: {
        type: String,
        enum: ['active', 'draft', 'sold'],
        default: 'active',
    },
    description: { type: String, default: '' },
    details: [{ type: String }],
    image: { type: String, default: 'images/vintage_denim_jacket.png' },
    badge: { type: String, default: null },
    badgeColor: { type: String, default: null },
}, { timestamps: true });

// Index for storefront queries
productSchema.index({ status: 1, stock: 1, category: 1 });
// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text', era: 'text' });

module.exports = mongoose.model('Product', productSchema);
