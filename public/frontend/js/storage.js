// js/storage.js

const StorageService = {
    prefix: 'khojum_',

    save(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serializedValue);
            // console.log(`Saved to localStorage: ${key}`, value); // Debugging
        } catch (e) {
            console.error(`Error saving to localStorage for key "${key}":`, e);
        }
    },

    load(key, defaultValue = null) {
        try {
            const serializedValue = localStorage.getItem(this.prefix + key);
            if (serializedValue === null || serializedValue === 'undefined') {
                // console.log(`Loaded default from localStorage: ${key}`, defaultValue); // Debugging
                return defaultValue;
            }
            const value = JSON.parse(serializedValue);
            // console.log(`Loaded from localStorage: ${key}`, value); // Debugging
            return value;
        } catch (e) {
            console.error(`Error loading from localStorage for key "${key}":`, e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            // console.log(`Removed from localStorage: ${key}`); // Debugging
        } catch (e) {
            console.error(`Error removing from localStorage for key "${key}":`, e);
        }
    }
};