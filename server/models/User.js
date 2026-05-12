const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');

const User = {
    create({ name, email, password, role = 'customer' }) {
        const db = getDB();
        const hashedPassword = bcrypt.hashSync(password, 12);

        const user = {
            id: db.users.length + 1,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };

        db.users.push(user);

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    findById(id) {
        const db = getDB();
        const user = db.users.find(u => u.id === parseInt(id));
        if (!user) return null;
        const { password, ...result } = user;
        return result;
    },

    findByEmail(email) {
        const db = getDB();
        return db.users.find(u => u.email === email.toLowerCase());
    },

    comparePassword(user, password) {
        return bcrypt.compareSync(password, user.password);
    },

    getCart(userId) {
        const db = getDB();
        const user = db.users.find(u => u.id === userId);
        if (!user || !user.cart) return [];

        return user.cart.map(item => {
            const product = db.products.find(p => p.id === item.productId);
            if (!product) return null;
            return {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                era: product.era,
                size: product.size,
                qty: item.qty
            };
        }).filter(Boolean);
    },

    updateCart(userId, items) {
        const db = getDB();
        const user = db.users.find(u => u.id === userId);
        if (user) {
            user.cart = items;
        }
    },

    getWishlist(userId) {
        const db = getDB();
        const user = db.users.find(u => u.id === userId);
        if (!user || !user.wishlist) return [];

        return user.wishlist.map(productId =>
            db.products.find(p => p.id === productId)
        ).filter(Boolean);
    },

    toggleWishlist(userId, productId) {
        const db = getDB();
        const user = db.users.find(u => u.id === userId);
        if (!user) return false;

        if (!user.wishlist) user.wishlist = [];

        const idx = user.wishlist.indexOf(productId);
        if (idx > -1) {
            user.wishlist.splice(idx, 1);
            return false;
        } else {
            user.wishlist.push(productId);
            return true;
        }
    }
};

module.exports = User;