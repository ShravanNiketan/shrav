// API Service for handling all API interactions
const APIService = {
    /**
     * Build URL with query parameters
     * @private
     * @param {string} baseUrl - Base URL
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {string} Complete URL
     */
    _buildUrl(baseUrl, endpoint, params = {}) {
        const url = new URL(baseUrl + endpoint);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
        return url.toString();
    },

    /**
     * Make API request with error handling
     * @private
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise} Response data
     */
    async _makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || 
                    `HTTP error! status: ${response.status}`
                );
            }

            const data = await response.json();
            
            // Validate response structure
            if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
                throw new Error('Empty or invalid response received');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', {
                url,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    },

    /**
     * Search for locations by name
     * @param {string} query - Search query
     * @returns {Promise} Location search results
     */
    async searchLocations(query) {
        if (!query || typeof query !== 'string') {
            throw new Error(API_CONFIG.errors.geocoding.invalidQuery);
        }

        const params = {
            [API_CONFIG.params.geocoding.name]: query,
            [API_CONFIG.params.geocoding.count]: API_CONFIG.defaults.resultCount,
            [API_CONFIG.params.geocoding.language]: API_CONFIG.defaults.language,
            [API_CONFIG.params.geocoding.format]: API_CONFIG.defaults.format
        };

        const url = this._buildUrl(
            API_CONFIG.openMeteo.geocoding.baseUrl,
            API_CONFIG.openMeteo.geocoding.search,
            params
        );

        try {
            const data = await this._makeRequest(url);
            
            if (!data.results || !data.results.length) {
                throw new Error(API_CONFIG.errors.geocoding.noResults);
            }

            return data.results.map(location => ({
                lat: location.latitude,
                lon: location.longitude,
                name: location.name,
                country: location.country,
                admin1: location.admin1,
                timezone: location.timezone,
                population: location.population,
                elevation: location.elevation
            }));
        } catch (error) {
            if (error.message === API_CONFIG.errors.geocoding.noResults) {
                throw error;
            }
            throw new Error(API_CONFIG.errors.geocoding.apiError);
        }
    },

    /**
     * Get sun data for location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise} Sunrise/sunset data
     */
    async getSunData(lat, lon) {
        if (typeof lat !== 'number' || typeof lon !== 'number') {
            throw new Error(API_CONFIG.errors.weather.invalidCoords);
        }

        const params = {
            [API_CONFIG.params.weather.latitude]: lat,
            [API_CONFIG.params.weather.longitude]: lon,
            [API_CONFIG.params.weather.daily]: API_CONFIG.defaults.required_daily_params.join(','),
            [API_CONFIG.params.weather.timezone]: 'auto',
            [API_CONFIG.params.weather.forecast_days]: API_CONFIG.defaults.forecast_days
        };

        const url = this._buildUrl(
            API_CONFIG.openMeteo.weather.baseUrl,
            API_CONFIG.openMeteo.weather.forecast,
            params
        );

        try {
            const data = await this._makeRequest(url);
            
            if (!data.daily) {
                throw new Error(API_CONFIG.errors.weather.noData);
            }

            // Transform API response into our desired format
            const times = data.daily.time.map((date, index) => ({
                date,
                sunrise: data.daily.sunrise[index],
                sunset: data.daily.sunset[index]
            }));

            return {
                times,
                lastFetch: new Date().toISOString()
            };
        } catch (error) {
            if (error.message === API_CONFIG.errors.weather.noData) {
                throw error;
            }
            throw new Error(API_CONFIG.errors.weather.fetchError);
        }
    }
};

// Prevent modifications to the APIService object
Object.freeze(APIService);