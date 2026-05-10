const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        name: String, address: String, city: String,
        state: String, zip: String, country: String,
    },
    payment: {
        method: String,
        last4: String,
    },
}, { timestamps: true });

// Auto-generate orderId before saving
orderSchema.pre('save', async function (next) {
    if (this.orderId) return next();
    const last = await this.constructor.findOne().sort({ createdAt: -1 });
    const lastNum = last?.orderId ? parseInt(last.orderId.replace('ORD-', '')) : 1000;
    this.orderId = `ORD-${lastNum + 1}`;
    next();
});

orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
