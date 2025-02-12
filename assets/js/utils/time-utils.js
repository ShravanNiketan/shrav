// Time utility functions
const TimeUtils = {
    /**
     * Parse an ISO date string into a Date object
     * @param {string} isoString - ISO date string
     * @returns {Date} JavaScript Date object
     */
    parseISOString(isoString) {
        return new Date(isoString);
    },

    /**
     * Format a date to YYYY-MM-DD
     * @param {Date} date - Date object to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Get current time in user's timezone
     * @returns {Date} Current date and time
     */
    getCurrentTime() {
        return new Date();
    },

    /**
     * Check if a given time is between sunrise and sunset
     * @param {Date} currentTime - Current time to check
     * @param {Date} sunrise - Sunrise time
     * @param {Date} sunset - Sunset time
     * @returns {boolean} True if current time is during daylight hours
     */
    isDaytime(currentTime, sunrise, sunset) {
        return currentTime >= sunrise && currentTime <= sunset;
    },

    /**
     * Calculate time until next theme switch
     * @param {Date} currentTime - Current time
     * @param {Date} sunrise - Next sunrise time
     * @param {Date} sunset - Next sunset time
     * @returns {number} Milliseconds until next switch
     */
    getTimeUntilNextSwitch(currentTime, sunrise, sunset) {
        if (this.isDaytime(currentTime, sunrise, sunset)) {
            return sunset.getTime() - currentTime.getTime();
        }
        return sunrise.getTime() - currentTime.getTime();
    },

    /**
     * Find today's sunrise/sunset times from the data array
     * @param {Array} sunData - Array of daily sunrise/sunset data
     * @returns {Object|null} Today's sun data or null if not found
     */
    getTodaysSunData(sunData) {
        const today = this.formatDate(this.getCurrentTime());
        return sunData.find(day => this.formatDate(this.parseISOString(day.date)) === today) || null;
    },

    /**
     * Check if stored sun data needs to be refreshed
     * @param {string} lastFetch - ISO date string of last fetch
     * @returns {boolean} True if data needs refresh
     */
    needsRefresh(lastFetch) {
        if (!lastFetch) return true;
        
        const lastFetchDate = this.parseISOString(lastFetch);
        const currentTime = this.getCurrentTime();
        
        // Check if last fetch was more than 24 hours ago
        return (currentTime - lastFetchDate) >= API_CONFIG.cache.sunDataExpiry;
    },

    /**
     * Format time for display
     * @param {Date} date - Date object to format
     * @returns {string} Formatted time string (e.g., "9:30 AM")
     */
    formatTimeForDisplay(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Get next occurrence of sunrise or sunset
     * @param {Array} sunData - Array of daily sunrise/sunset data
     * @returns {Object} Next sunrise and sunset times
     */
    getNextSunEvent(sunData) {
        const currentTime = this.getCurrentTime();
        const todayData = this.getTodaysSunData(sunData);
        
        if (!todayData) return null;

        const todaySunrise = this.parseISOString(todayData.sunrise);
        const todaySunset = this.parseISOString(todayData.sunset);
        
        // If before today's sunrise, use today's times
        if (currentTime < todaySunrise) {
            return {
                nextSunrise: todaySunrise,
                nextSunset: todaySunset
            };
        }
        
        // If between sunrise and sunset, use today's sunset and tomorrow's sunrise
        if (currentTime < todaySunset) {
            const tomorrowData = sunData[1]; // Tomorrow's data
            return {
                nextSunrise: this.parseISOString(tomorrowData.sunrise),
                nextSunset: todaySunset
            };
        }
        
        // If after sunset, use tomorrow's times
        const tomorrowData = sunData[1];
        return {
            nextSunrise: this.parseISOString(tomorrowData.sunrise),
            nextSunset: this.parseISOString(tomorrowData.sunset)
        };
    }
};

// Prevent modifications to the TimeUtils object
Object.freeze(TimeUtils);