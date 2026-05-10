const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    storeName: { type: String, default: 'Revival' },
    tagline: { type: String, default: 'Curated Thrift' },
    currency: { type: String, default: 'USD' },
    taxRate: { type: Number, default: 8.5 },
    freeShippingThreshold: { type: Number, default: 100 },
    flatShippingRate: { type: Number, default: 8.99 },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
