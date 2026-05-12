const { getDB, saveDB } = require('../config/db');

const Settings = {
    get() {
        const db = getDB();
        const result = db.exec('SELECT * FROM settings LIMIT 1');
        if (result.length === 0 || result[0].values.length === 0) {
            return { storeName: 'Revival Thrift Store', currency: 'USD', taxRate: 0.085 };
        }
        return this._mapRow(result[0].columns, result[0].values[0]);
    },

    update(data) {
        const db = getDB();
        const fields = [];
        const params = [];

        const fieldMap = {
            storeName: 'store_name', storeEmail: 'store_email',
            storePhone: 'store_phone', storeAddress: 'store_address',
            currency: 'currency', taxRate: 'tax_rate'
        };

        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (data[key] !== undefined) {
                fields.push(`${dbField} = ?`);
                params.push(data[key]);
            }
        }

        if (fields.length === 0) return this.get();

        db.run(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, params);
        saveDB();
        return this.get();
    },

    _mapRow(columns, row) {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return {
            storeName: obj.store_name,
            storeEmail: obj.store_email,
            storePhone: obj.store_phone,
            storeAddress: obj.store_address,
            currency: obj.currency,
            taxRate: obj.tax_rate
        };
    }
};

module.exports = Settings;