// Storage Service for managing localStorage operations
const StorageService = {
    // Storage keys
    keys: {
        THEME: 'theme',
        LOCATION: 'location',
        SUN_DATA: 'sunData'
    },

    /**
     * Get value from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed value or null
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error retrieving ${key} from localStorage:`, error);
            return null;
        }
    },

    /**
     * Set value in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error storing ${key} in localStorage:`, error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
        }
    },

    /**
     * Clear all stored data
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    },

    /**
     * Get stored theme
     * @returns {string|null} Stored theme or null
     */
    getTheme() {
        return this.get(this.keys.THEME);
    },

    /**
     * Set theme
     * @param {string} theme - Theme to store
     * @returns {boolean} Success status
     */
    setTheme(theme) {
        return this.set(this.keys.THEME, theme);
    },

    /**
     * Get stored location data
     * @returns {Object|null} Location data or null
     */
    getLocation() {
        const location = this.get(this.keys.LOCATION);
        if (location && this.isLocationValid(location)) {
            return location;
        }
        return null;
    },

    /**
     * Set location data
     * @param {Object} location - Location data to store
     * @returns {boolean} Success status
     */
    setLocation(location) {
        if (!this.isLocationValid(location)) {
            console.error('Invalid location data:', location);
            return false;
        }
        return this.set(this.keys.LOCATION, {
            ...location,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Validate location data
     * @param {Object} location - Location data to validate
     * @returns {boolean} Validation result
     */
    isLocationValid(location) {
        return location &&
            location.coordinates &&
            typeof location.coordinates.lat === 'number' &&
            typeof location.coordinates.lon === 'number' &&
            location.location &&
            typeof location.location.name === 'string' &&
            location.metadata &&
            typeof location.metadata.source === 'string' &&
            (!location.metadata.timestamp || TimeUtils.parseISOString(location.metadata.timestamp) instanceof Date);
    },

    /**
     * Get stored sun data
     * @returns {Object|null} Sun data or null
     */
    getSunData() {
        const sunData = this.get(this.keys.SUN_DATA);
        if (sunData && this.isSunDataValid(sunData)) {
            return sunData;
        }
        return null;
    },

    /**
     * Set sun data
     * @param {Object} data - Sun data to store
     * @returns {boolean} Success status
     */
    setSunData(data) {
        if (!this.isSunDataValid(data)) {
            console.error('Invalid sun data:', data);
            return false;
        }
        return this.set(this.keys.SUN_DATA, {
            ...data,
            lastFetch: new Date().toISOString()
        });
    },

    /**
     * Validate sun data
     * @param {Object} data - Sun data to validate
     * @returns {boolean} Validation result
     */
    isSunDataValid(data) {
        return data &&
            Array.isArray(data.times) &&
            data.times.length > 0 &&
            data.times.every(day => 
                day.date &&
                day.sunrise &&
                day.sunset &&
                TimeUtils.parseISOString(day.date) instanceof Date &&
                TimeUtils.parseISOString(day.sunrise) instanceof Date &&
                TimeUtils.parseISOString(day.sunset) instanceof Date
            ) &&
            (!data.lastFetch || TimeUtils.parseISOString(data.lastFetch) instanceof Date);
    },

    /**
     * Check if location data needs refresh
     * @param {Object} location - Location data to check
     * @returns {boolean} True if refresh needed
     */
    isLocationStale(location) {
        if (!location || !location.timestamp) return true;
        
        const timestamp = TimeUtils.parseISOString(location.timestamp);
        const currentTime = new Date();
        return (currentTime - timestamp) >= API_CONFIG.cache.locationExpiry;
    }
};

// Prevent modifications to the StorageService object
Object.freeze(StorageService);