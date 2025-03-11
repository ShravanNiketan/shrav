// Location Service for handling all location-related operations
const LocationService = {
    // Cache for IP location
    _ipLocation: null,

    /**
     * Create standardized location object
     * @private
     * @param {Object} data - Raw location data
     * @returns {Object} Standardized location object
     */
    _createLocationObject(data) {
        return {
            coordinates: {
                lat: data.lat || data.latitude || 0,
                lon: data.lon || data.longitude || 0
            },
            location: {
                name: data.name || 'Unknown Location',
                region: data.admin1 || data.region || '',
                country: data.country || data.country_name || '',
                displayName: data.displayName || this._formatDisplayName(data)
            },
            metadata: {
                source: data.source || 'unknown',
                timestamp: new Date().toISOString(),
                accuracy: data.accuracy || null
            }
        };
    },

    /**
     * Format display name from location components
     * @private
     * @param {Object} data - Location data
     * @returns {string} Formatted display name
     */
    _formatDisplayName(data) {
        const parts = [];
        
        // Add city/location name
        if (data.name) parts.push(data.name);
        
        // Add region/state/province
        if (data.admin1 || data.region) {
            parts.push(data.admin1 || data.region);
        }
        
        // Add country
        if (data.country || data.country_name) {
            parts.push(data.country || data.country_name);
        }
        
        return parts.filter(Boolean).join(', ') || 'Unknown Location';
    },

    /**
     * Calculate distance between two points using Haversine formula
     * @private
     * @param {number} lat1 - First latitude
     * @param {number} lon1 - First longitude
     * @param {number} lat2 - Second latitude
     * @param {number} lon2 - Second longitude
     * @returns {number} Distance in kilometers
     */
    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this._toRad(lat2 - lat1);
        const dLon = this._toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    /**
     * Convert degrees to radians
     * @private
     * @param {number} deg - Degrees
     * @returns {number} Radians
     */
    _toRad(deg) {
        return deg * (Math.PI/180);
    },

    /**
     * Get location using device geolocation
     * @returns {Promise<Object>} Location data
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error(API_CONFIG.errors.location.unavailable));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const locationData = this._createLocationObject({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                            source: 'geolocation',
                            accuracy: position.coords.accuracy
                        });

                        // Get location name from coordinates
                        try {
                            const locationDetails = await this.getLocationName(
                                locationData.coordinates.lat,
                                locationData.coordinates.lon
                            );
                            locationData.location = {
                                ...locationData.location,
                                ...locationDetails
                            };
                        } catch (error) {
                            console.warn('Could not get location name:', error);
                        }

                        resolve(locationData);
                    } catch (error) {
                        reject(new Error(API_CONFIG.errors.location.unavailable));
                    }
                },
                (error) => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error(API_CONFIG.errors.location.permissionDenied));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error(API_CONFIG.errors.location.unavailable));
                            break;
                        default:
                            reject(new Error(API_CONFIG.errors.location.unavailable));
                    }
                }
            );
        });
    },

    /**
     * Get location from IP address
     * @returns {Promise<Object>} Location data
     */
    async getIPLocation() {
        try {
            // Return cached IP location if available
            if (this._ipLocation) {
                return this._ipLocation;
            }

            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('IP location service failed');
            
            const data = await response.json();
            if (!data.latitude || !data.longitude) {
                throw new Error('Invalid IP location data');
            }
            
            this._ipLocation = this._createLocationObject({
                lat: parseFloat(data.latitude),
                lon: parseFloat(data.longitude),
                name: data.city || 'Unknown City',
                region: data.region || '',
                country_name: data.country_name || 'Unknown Country',
                source: 'ip'
            });

            return this._ipLocation;
        } catch (error) {
            console.error('IP location failed:', error);
            throw new Error(API_CONFIG.errors.location.unavailable);
        }
    },

    /**
     * Get location name from coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Location details
     */
    async getLocationName(lat, lon) {
        const params = {
            latitude: lat,
            longitude: lon,
            language: API_CONFIG.defaults.language,
            format: API_CONFIG.defaults.format
        };

        const url = APIService._buildUrl(
            API_CONFIG.openMeteo.geocoding.baseUrl,
            API_CONFIG.openMeteo.geocoding.search,
            params
        );

        try {
            const data = await APIService._makeRequest(url);
            if (!data.results || !data.results.length) {
                throw new Error('Location not found');
            }

            const location = data.results[0];
            return {
                name: location.name || 'Unknown Location',
                region: location.admin1 || '',
                country: location.country || '',
                displayName: this._formatDisplayName(location)
            };
        } catch (error) {
            console.error('Error getting location name:', error);
            return {
                name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                region: '',
                country: '',
                displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
            };
        }
    },

    /**
     * Format location name from API response
     * @param {Object} location - Location data from API
     * @returns {string} Formatted location name
     */
    formatLocationName(location) {
        const parts = [];
        
        if (location.name) {
            parts.push(location.name);
        }
        
        if (location.admin1 && location.admin1 !== location.name) {
            parts.push(location.admin1);
        }
        
        if (location.country) {
            parts.push(location.country);
        }

        return parts.filter(Boolean).join(', ');
    },

    /**
     * Sort locations by distance from reference point
     * @private
     * @param {Array} locations - Array of locations to sort
     * @param {Object} referencePoint - Reference coordinates {lat, lon}
     * @returns {Array} Sorted locations
     */
    _sortByDistance(locations, referencePoint) {
        return locations.map(location => ({
            ...location,
            distance: this._calculateDistance(
                referencePoint.lat,
                referencePoint.lon,
                location.coordinates.lat,
                location.coordinates.lon
            )
        }))
        .sort((a, b) => a.distance - b.distance);
    },

    /**
     * Search locations by query
     * @param {string} query - Search query
     * @returns {Promise<Array>} Search results
     */
    async searchLocations(query) {
        try {
            // Get regular search results
            const results = await APIService.searchLocations(query);
            
            // Try to get IP location for proximity sorting
            let ipLocation = null;
            try {
                ipLocation = await this.getIPLocation();
            } catch (error) {
                console.warn('Could not get IP location for proximity sorting');
            }

            // Transform results to standardized format
            const transformedResults = results.map(location => 
                this._createLocationObject({
                    ...location,
                    source: 'search'
                })
            );

            // Sort by distance if IP location is available
            if (ipLocation) {
                return await this._sortByDistance(
                    transformedResults,
                    ipLocation.coordinates
                );
            }

            return transformedResults;
        } catch (error) {
            console.error('Error searching locations:', error);
            throw error;
        }
    },

    /**
     * Initialize location tracking
     * @returns {Promise<Object>} Location data
     */
    async initializeLocation() {
        let location = StorageService.getLocation();
        
        // Check if stored location is valid and not stale
        if (location && !StorageService.isLocationStale(location)) {
            return location;
        }

        // No valid stored location, let the caller handle getting a new location
        throw new Error('No valid location stored');
    },

    /**
     * Update location with new data
     * @param {Object} locationData - New location data
     * @returns {Promise<Object>} Updated location data
     */
    async updateLocation(locationData) {
        try {
            // Validate basic location data structure
            if (!locationData || 
                !locationData.coordinates || 
                typeof locationData.coordinates.lat !== 'number' || 
                typeof locationData.coordinates.lon !== 'number') {
                throw new Error('Invalid location data');
            }

            // If the incoming data isn't in our standardized format, convert it
            let standardizedLocation = locationData;
            if (!locationData.metadata || !locationData.location) {
                standardizedLocation = this._createLocationObject(locationData);
            }

            // If no location name provided, get it from coordinates
            if (!standardizedLocation.location.name || standardizedLocation.location.name === 'Unknown Location') {
                try {
                    const locationDetails = await this.getLocationName(
                        standardizedLocation.coordinates.lat,
                        standardizedLocation.coordinates.lon
                    );
                    standardizedLocation.location = {
                        ...standardizedLocation.location,
                        ...locationDetails
                    };
                } catch (error) {
                    console.warn('Could not get location name:', error);
                }
            }

            // Update timestamp
            standardizedLocation.metadata.timestamp = new Date().toISOString();

            // Store updated location
            StorageService.setLocation(standardizedLocation);

            return standardizedLocation;
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    }
};

// Prevent modifications to the LocationService object
Object.freeze(LocationService);