// Natural Theme Component
class NaturalTheme {
    constructor(setThemeCallback) {
        // Store the callback for theme changes
        this.setTheme = setThemeCallback;

        // Initialize properties
        this.updateTimer = null;
        this.location = null;
        this.sunData = null;

        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.handleLocationUpdate = this.handleLocationUpdate.bind(this);
        this.updateTheme = this.updateTheme.bind(this);
        this.scheduleNextUpdate = this.scheduleNextUpdate.bind(this);
        this.cleanup = this.cleanup.bind(this);

        // Initialize location modal
        this.locationModal = new LocationModal(this.handleLocationUpdate);
    }

    /**
     * Initialize natural theme
     */
    async initialize() {
        try {
            // Get stored location or initialize new location
            this.location = await LocationService.initializeLocation();
            
            // Update location display with the standardized format
            if (this.location && this.location.location) {
                DOMUtils.updateLocationDisplay(this.location.location.displayName);
            }

            // Get sun data and start theme updates
            await this.updateSunData();
            this.updateTheme();
        } catch (error) {
            console.error('Error initializing natural theme:', error);
            // Don't throw error, just show modal
            this.showLocationModal();
            // Set a default theme while waiting for location
            this.setTheme('dark');
        }
    }

    /**
     * Show location selection modal
     */
    showLocationModal() {
        this.locationModal.show();
    }

    /**
     * Handle location update
     * @param {Object} locationData - New location data
     */
    async handleLocationUpdate(locationData) {
        try {
            // Update location with standardized data
            this.location = await LocationService.updateLocation(locationData);
            
            // Update location display with formatted name
            if (this.location && this.location.location) {
                DOMUtils.updateLocationDisplay(this.location.location.displayName);
            }

            // Update sun data and theme
            await this.updateSunData();
            this.updateTheme();

            // Show success toast
            Toast.show({
                title: 'Location Updated',
                message: `Location set to ${this.location.location.displayName}`,
                type: 'success',
                duration: 3000
            });
        } catch (error) {
            console.error('Error updating location:', error);
            Toast.show({
                title: 'Location Error',
                message: 'Failed to update location. Please try again.',
                type: 'warning',
                duration: 4000
            });
            throw error;
        }
    }

    /**
     * Update location display
     */
    updateLocationDisplay() {
        if (this.location && this.location.name) {
            DOMUtils.updateLocationDisplay(this.location.name);
        }
    }

    /**
     * Update sun data
     */
    async updateSunData() {
        try {
            // Check if we have valid cached data
            let cachedData = StorageService.getSunData();
            
            if (cachedData && !TimeUtils.needsRefresh(cachedData.lastFetch)) {
                this.sunData = cachedData;
                return;
            }

            if (!this.location || !this.location.coordinates) {
                throw new Error('Invalid location data');
            }

            // Fetch new sun data using coordinates from standardized location object
            this.sunData = await APIService.getSunData(
                this.location.coordinates.lat,
                this.location.coordinates.lon
            );

            // Store the new data
            StorageService.setSunData(this.sunData);
        } catch (error) {
            console.error('Error updating sun data:', error);
            Toast.show({
                title: 'Sun Data Error',
                message: 'Failed to update sunrise/sunset times. Theme updates may be delayed.',
                type: 'warning',
                duration: 4000
            });
            throw error;
        }
    }

    /**
     * Update theme based on current time
     */
    updateTheme() {
        if (!this.sunData || !this.sunData.times || !this.sunData.times.length) {
            console.warn('No sun data available, using system time');
            // Default to dark theme at night (7 PM - 7 AM)
            const hour = new Date().getHours();
            const isDaytime = hour >= 7 && hour < 19;
            this.setTheme(isDaytime ? 'light' : 'dark');
            return;
        }

        // Clear any existing update timer
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        const currentTime = TimeUtils.getCurrentTime();
        const todayData = TimeUtils.getTodaysSunData(this.sunData.times);

        if (!todayData) {
            console.error('No sun data available for today');
            return;
        }

        const sunrise = TimeUtils.parseISOString(todayData.sunrise);
        const sunset = TimeUtils.parseISOString(todayData.sunset);

        // Set theme based on current time
        const isDaytime = TimeUtils.isDaytime(currentTime, sunrise, sunset);
        this.setTheme(isDaytime ? 'light' : 'dark');

        // Schedule next update
        this.scheduleNextUpdate();
    }

    /**
     * Schedule next theme update
     */
    scheduleNextUpdate() {
        if (!this.sunData || !this.sunData.times.length) return;

        const currentTime = TimeUtils.getCurrentTime();
        const nextEvent = TimeUtils.getNextSunEvent(this.sunData.times);

        if (!nextEvent) {
            console.error('Unable to determine next sun event');
            return;
        }

        // Calculate time until next switch
        const timeUntilNext = TimeUtils.getTimeUntilNextSwitch(
            currentTime,
            nextEvent.nextSunrise,
            nextEvent.nextSunset
        );

        // Schedule update
        this.updateTimer = setTimeout(() => {
            this.updateTheme();
        }, timeUntilNext);
    }

    /**
     * Clean up natural theme
     */
    cleanup() {
        // Clear update timer
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        // Clean up location modal
        if (this.locationModal) {
            this.locationModal.cleanup();
        }

        // Clear location data
        this.location = null;
        this.sunData = null;
    }
}