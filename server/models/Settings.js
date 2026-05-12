const { getDB } = require('../config/db');

const Settings = {
    get() {
        const db = getDB();
        return db.settings;
    },

    update(data) {
        const db = getDB();
        const allowedFields = ['storeName', 'storeEmail', 'storePhone', 'storeAddress', 'currency', 'taxRate'];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
                db.settings[dbField] = data[field];
            }
        }

        return db.settings;
    }
};

module.exports = Settings;