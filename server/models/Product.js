const { getDB, saveDB } = require('../config/db');

const Product = {
    create(data) {
        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO products (name, price, original_price, category, era, condition, size, stock, status, description, image, badge, badge_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([
            data.name, data.price, data.originalPrice, data.category, data.era,
            data.condition || 'Good', data.size, data.stock || 1, data.status || 'active',
            data.description || '', data.image || 'images/vintage_denim_jacket.png',
            data.badge || null, data.badgeColor || null
        ]);
        saveDB();
        return this.findById(db.exec('SELECT last_insert_rowid() as id')[0].values[0][0]);
    },

    findById(id) {
        const db = getDB();
        const result = db.exec('SELECT * FROM products WHERE id = ?', [id]);
        if (result.length === 0 || result[0].values.length === 0) return null;
        return this._mapRow(result[0].columns, result[0].values[0]);
    },

    findAll({ category, search, all, limit = 100 } = {}) {
        const db = getDB();
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (!all) {
            sql += ' AND status = ? AND stock > 0';
            params.push('active');
        }
        if (category && category !== 'all') {
            sql += ' AND category = ?';
            params.push(category.toLowerCase());
        }
        if (search) {
            sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR era LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }
        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const result = db.exec(sql, params);
        if (result.length === 0) return [];
        return result[0].values.map(row => this._mapRow(result[0].columns, row));
    },

    update(id, data) {
        const db = getDB();
        const fields = [];
        const params = [];

        const fieldMap = {
            name: 'name', price: 'price', originalPrice: 'original_price',
            category: 'category', era: 'era', condition: 'condition',
            size: 'size', stock: 'stock', status: 'status',
            description: 'description', image: 'image', badge: 'badge', badgeColor: 'badge_color'
        };

        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (data[key] !== undefined) {
                fields.push(`${dbField} = ?`);
                params.push(data[key]);
            }
        }

        if (fields.length === 0) return this.findById(id);

        params.push(id);
        db.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
        saveDB();
        return this.findById(id);
    },

    delete(id) {
        const db = getDB();
        db.run('DELETE FROM products WHERE id = ?', [id]);
        saveDB();
    },

    getCategories() {
        const db = getDB();
        const result = db.exec("SELECT DISTINCT category FROM products WHERE status = 'active' AND stock > 0");
        if (result.length === 0) return ['all'];
        const cats = result[0].values.map(r => r[0]);
        return ['all', ...cats];
    },

    updateStock(id, qty) {
        const db = getDB();
        db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [qty, id]);
        saveDB();
    },

    _mapRow(columns, row) {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return {
            id: obj.id,
            name: obj.name,
            price: obj.price,
            originalPrice: obj.original_price,
            category: obj.category,
            era: obj.era,
            condition: obj.condition,
            size: obj.size,
            stock: obj.stock,
            status: obj.status,
            description: obj.description,
            image: obj.image,
            badge: obj.badge,
            badgeColor: obj.badge_color,
            createdAt: obj.created_at
        };
    }
};

module.exports = Product;