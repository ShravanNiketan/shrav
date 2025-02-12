// API Configuration
const API_CONFIG = {
    // Open-Meteo API endpoints
    openMeteo: {
        geocoding: {
            baseUrl: 'https://geocoding-api.open-meteo.com/v1',
            search: '/search',
        },
        weather: {
            baseUrl: 'https://api.open-meteo.com/v1',
            forecast: '/forecast',
        }
    },

    // API request parameters
    params: {
        geocoding: {
            name: 'name',           // City name parameter
            count: 'count',         // Number of results to return
            language: 'language',   // Response language
            format: 'format'        // Response format
        },
        weather: {
            latitude: 'latitude',
            longitude: 'longitude',
            daily: 'daily',
            timezone: 'timezone',
            forecast_days: 'forecast_days'
        }
    },

    // Default values
    defaults: {
        resultCount: 5,            // Default number of location results
        language: 'en',            // Default language for responses
        format: 'json',            // Default response format
        forecast_days: 7,          // Number of days to forecast
        required_daily_params: ['sunrise', 'sunset']  // Required daily parameters
    },

    // Cache settings
    cache: {
        locationExpiry: 30 * 24 * 60 * 60 * 1000,  // 30 days in milliseconds
        sunDataExpiry: 24 * 60 * 60 * 1000         // 24 hours in milliseconds
    },

    // Error messages
    errors: {
        geocoding: {
            noResults: 'No locations found. Please try a different search term.',
            invalidQuery: 'Please enter a valid location name.',
            apiError: 'Unable to search locations. Please try again later.'
        },
        weather: {
            fetchError: 'Unable to fetch sunrise/sunset data. Please try again later.',
            invalidCoords: 'Invalid coordinates provided.',
            noData: 'No weather data available for this location.'
        },
        location: {
            permissionDenied: 'Location permission was denied. Please enter your location manually.',
            unavailable: 'Unable to get your location. Please try entering it manually.',
            timeout: 'Location request timed out. Please try entering your location manually.'
        }
    }
};

// Prevent modifications to the configuration object
Object.freeze(API_CONFIG);