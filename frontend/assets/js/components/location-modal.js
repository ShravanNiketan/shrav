// Location Modal Component
class LocationModal {
    constructor(onLocationSelect) {
        // Store callback
        this.onLocationSelect = onLocationSelect;

        // Bind methods
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleResultClick = this.handleResultClick.bind(this);
        this.handleDeviceLocation = this.handleDeviceLocation.bind(this);
        this.handleIPLocation = this.handleIPLocation.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.checkLocationPermission = this.checkLocationPermission.bind(this);

        // Initialize
        this.init();
    }

    /**
     * Initialize modal
     */
    init() {
        // Set up DOM elements
        this.setupDOMElements();
        
        // Set up event listeners
        this.setupEventListeners();

        // Set up search debounce
        this.searchTimeout = null;
        this.DEBOUNCE_DELAY = 300;

        // Check initial permission state
        this.checkLocationPermission();
    }

    /**
     * Check location permission state
     */
    async checkLocationPermission() {
        try {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                this.deviceButton.style.display = 'none';
                return;
            }

            // Check if permissions API is supported
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                
                if (result.state === 'denied') {
                    this.deviceButton.style.display = 'none';
                }

                // Listen for permission changes
                result.addEventListener('change', () => {
                    if (result.state === 'denied') {
                        this.deviceButton.style.display = 'none';
                    } else {
                        this.deviceButton.style.display = 'block';
                    }
                });
            }
        } catch (error) {
            console.error('Error checking location permission:', error);
        }
    }

    /**
     * Set up DOM element references
     */
    setupDOMElements() {
        this.modal = DOMUtils.getElement('location-modal');
        this.searchInput = DOMUtils.getElement('location-search-input');
        this.resultsContainer = DOMUtils.getElement('location-results');
        this.loadingElement = DOMUtils.getElement('location-loading');
        this.errorElement = DOMUtils.getElement('location-error');
        this.deviceButton = DOMUtils.getElement('location-modal-device');
        this.ipButton = DOMUtils.getElement('location-modal-ip');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search input
        DOMUtils.addListener('location-search-input', 'input', this.handleSearchInput);

        // Button clicks
        DOMUtils.addListener('location-modal-device', 'click', this.handleDeviceLocation);
        DOMUtils.addListener('location-modal-ip', 'click', this.handleIPLocation);
        DOMUtils.addListener('location-modal-cancel', 'click', this.handleCancel);

        // Outside click
        this.modal.addEventListener('click', this.handleOutsideClick);
    }

    /**
     * Show modal
     */
    show() {
        DOMUtils.showElement('location-modal');
        this.searchInput.value = '';
        this.searchInput.focus();
        DOMUtils.setHTML('location-results', '');
        DOMUtils.hideError('location-error');
        this.resetButtons();
    }

    /**
     * Hide modal
     */
    hide() {
        DOMUtils.hideElement('location-modal');
        this.clearSearch();
    }

    /**
     * Reset button states
     */
    resetButtons() {
        this.deviceButton.textContent = 'Use Device Location';
        this.ipButton.textContent = 'Use Approximate Location (IP)';
        this.deviceButton.disabled = false;
        this.ipButton.disabled = false;
    }

    /**
     * Clear search state
     */
    clearSearch() {
        this.searchInput.value = '';
        DOMUtils.setHTML('location-results', '');
        DOMUtils.hideError('location-error');
        DOMUtils.hideElement('location-loading');
        this.resetButtons();
    }

    /**
     * Handle search input with debounce
     */
    handleSearchInput(event) {
        const query = event.target.value.trim();

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Clear previous results if query is empty
        if (!query) {
            this.clearSearch();
            return;
        }

        // Set new timeout for search
        this.searchTimeout = setTimeout(async () => {
            try {
                DOMUtils.showLoading('location-loading', 'location-results');
                DOMUtils.hideError('location-error');

                const results = await LocationService.searchLocations(query);
                this.displayResults(results);
            } catch (error) {
                DOMUtils.showError('location-error', error.message);
                DOMUtils.setHTML('location-results', '');
            } finally {
                DOMUtils.hideLoading('location-loading', 'location-results');
            }
        }, this.DEBOUNCE_DELAY);
    }

    /**
     * Display search results
     */
    displayResults(results) {
        const resultsHTML = results
            .map(location => DOMUtils.createLocationResultHTML(location))
            .join('');

        DOMUtils.setHTML('location-results', resultsHTML);

        // Add click handlers to results
        const resultItems = this.resultsContainer.getElementsByClassName('location-result-item');
        Array.from(resultItems).forEach(item => {
            item.addEventListener('click', () => this.handleResultClick(item));
        });
    }

    /**
     * Handle device location button click
     */
    async handleDeviceLocation() {
        try {
            this.deviceButton.disabled = true;
            DOMUtils.showLoading('location-loading', 'location-results');
            DOMUtils.hideError('location-error');
            this.deviceButton.textContent = 'Requesting Location...';

            // Create a promise for the geolocation request
            const locationPromise = new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    maximumAge: 0
                    // Removed timeout to let browser handle it
                });
            });

            const position = await locationPromise;
            const location = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                source: 'geolocation'
            };

            // Get location name
            const locationName = await LocationService.getLocationName(location.lat, location.lon);
            location.name = locationName;

            await this.onLocationSelect(location);
            this.hide();
        } catch (error) {
            // Handle specific geolocation errors
            let errorMessage;
            if (error.code === 1) { // PERMISSION_DENIED
                errorMessage = 'Location access was denied. Please use another method.';
                this.deviceButton.style.display = 'none'; // Hide the button permanently
            } else if (error.code === 2) { // POSITION_UNAVAILABLE
                errorMessage = 'Unable to determine your location. Please try another method.';
            } else {
                errorMessage = 'An error occurred while getting your location. Please try another method.';
            }
            
            DOMUtils.showError('location-error', errorMessage);
            this.deviceButton.textContent = 'Location Unavailable';
            this.deviceButton.disabled = true;
        } finally {
            DOMUtils.hideLoading('location-loading', 'location-results');
        }
    }

    /**
     * Handle IP location button click
     */
    async handleIPLocation() {
        try {
            this.ipButton.disabled = true;
            DOMUtils.showLoading('location-loading', 'location-results');
            DOMUtils.hideError('location-error');
            this.ipButton.textContent = 'Getting location...';

            const location = await LocationService.getIPLocation();
            
            // Show a brief success message first
            Toast.show({
                title: 'Location Found',
                message: `Using approximate location: ${location.name}`,
                type: 'info',
                duration: 4000
            });

            // Short delay before closing modal
            await new Promise(resolve => setTimeout(resolve, 300));
            
            await this.onLocationSelect(location);
            this.hide();
        } catch (error) {
            DOMUtils.showError('location-error', 'Unable to get location from IP. Please try another method.');
            this.ipButton.textContent = 'IP Location Unavailable';
            
            Toast.show({
                title: 'Location Error',
                message: 'Could not determine your location from IP address.',
                type: 'warning',
                duration: 4000
            });
        } finally {
            DOMUtils.hideLoading('location-loading', 'location-results');
        }
    }

    /**
     * Handle result item click
     */
    async handleResultClick(item) {
        try {
            const locationData = {
                coordinates: {
                    lat: parseFloat(item.dataset.lat),
                    lon: parseFloat(item.dataset.lon)
                },
                location: {
                    name: item.querySelector('.location-result-name').textContent,
                    region: item.querySelector('.location-result-details').textContent.split(',')[0].trim(),
                    country: item.querySelector('.location-result-details').textContent.split(',')[1]?.trim() || '',
                    displayName: item.querySelector('.location-result-name').textContent + ', ' + 
                               item.querySelector('.location-result-details').textContent
                },
                metadata: {
                    source: 'search',
                    timestamp: new Date().toISOString()
                }
            };

            if (!locationData.coordinates.lat || !locationData.coordinates.lon || !locationData.location.name) {
                throw new Error('Invalid location data');
            }

            await this.onLocationSelect(locationData);
            this.hide();
        } catch (error) {
            console.error('Error selecting location:', error);
            DOMUtils.showError('location-error', 'Error selecting location. Please try again.');
            Toast.show({
                title: 'Location Error',
                message: 'Failed to select location. Please try again.',
                type: 'warning',
                duration: 4000
            });
        }
    }

    /**
     * Handle cancel button click
     */
    handleCancel() {
        this.hide();
    }

    /**
     * Handle click outside modal content
     */
    handleOutsideClick(event) {
        if (event.target === this.modal) {
            this.hide();
        }
    }

    /**
     * Clean up modal
     */
    cleanup() {
        // Remove event listeners
        this.modal.removeEventListener('click', this.handleOutsideClick);
        
        // Clear any running timeouts
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
}