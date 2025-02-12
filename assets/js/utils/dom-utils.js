// DOM manipulation utility functions
const DOMUtils = {
    /**
     * Cache of DOM elements
     * @private
     */
    _elements: new Map(),

    /**
     * Get element by ID with caching
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Found element or null
     */
    getElement(id) {
        if (!this._elements.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this._elements.set(id, element);
            }
        }
        return this._elements.get(id) || null;
    },

    /**
     * Clear the element cache
     */
    clearCache() {
        this._elements.clear();
    },

    /**
     * Show an element
     * @param {string} id - Element ID
     */
    showElement(id) {
        const element = this.getElement(id);
        if (element) {
            element.classList.add('active');
        }
    },

    /**
     * Hide an element
     * @param {string} id - Element ID
     */
    hideElement(id) {
        const element = this.getElement(id);
        if (element) {
            element.classList.remove('active');
        }
    },

    /**
     * Toggle element visibility
     * @param {string} id - Element ID
     * @returns {boolean} New visibility state
     */
    toggleElement(id) {
        const element = this.getElement(id);
        if (element) {
            const isVisible = element.classList.toggle('active');
            return isVisible;
        }
        return false;
    },

    /**
     * Set element text content
     * @param {string} id - Element ID
     * @param {string} text - Text content
     */
    setText(id, text) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = text;
        }
    },

    /**
     * Set element HTML content
     * @param {string} id - Element ID
     * @param {string} html - HTML content
     */
    setHTML(id, html) {
        const element = this.getElement(id);
        if (element) {
            element.innerHTML = html;
        }
    },

    /**
     * Add event listener with automatic element lookup
     * @param {string} id - Element ID
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     */
    addListener(id, event, handler, options = {}) {
        const element = this.getElement(id);
        if (element) {
            element.addEventListener(event, handler, options);
        }
    },

    /**
     * Remove event listener
     * @param {string} id - Element ID
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     */
    removeListener(id, event, handler, options = {}) {
        const element = this.getElement(id);
        if (element) {
            element.removeEventListener(event, handler, options);
        }
    },

    /**
     * Create location result item HTML
     * @param {Object} location - Location data
     * @returns {string} HTML string
     */
    createLocationResultHTML(location) {
        const coordinates = location.coordinates || location;
        const locationDetails = location.location || location;
        
        // Build details array
        const details = [];
        if (locationDetails.region) details.push(locationDetails.region);
        if (locationDetails.country) details.push(locationDetails.country);
        
        // Get distance if available
        const distanceText = location.distance ? 
            `<span class="location-distance">${Math.round(location.distance)}km away</span>` : '';
            
        return `
            <div class="location-result-item" data-lat="${coordinates.lat}" data-lon="${coordinates.lon}">
                <div class="location-result-name">${locationDetails.name}</div>
                <div class="location-result-details">
                    ${details.join(', ')}
                    ${distanceText}
                </div>
            </div>
        `;
    },

    /**
     * Show error message
     * @param {string} id - Error element ID
     * @param {string} message - Error message
     */
    showError(id, message) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = message;
            element.classList.add('active');
        }
    },

    /**
     * Hide error message
     * @param {string} id - Error element ID
     */
    hideError(id) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = '';
            element.classList.remove('active');
        }
    },

    /**
     * Show loading spinner
     * @param {string} loadingId - Loading element ID
     * @param {string} contentId - Content element ID to hide
     */
    showLoading(loadingId, contentId) {
        this.showElement(loadingId);
        if (contentId) {
            this.hideElement(contentId);
        }
    },

    /**
     * Hide loading spinner
     * @param {string} loadingId - Loading element ID
     * @param {string} contentId - Content element ID to show
     */
    hideLoading(loadingId, contentId) {
        this.hideElement(loadingId);
        if (contentId) {
            this.showElement(contentId);
        }
    },

    /**
     * Update theme selector value
     * @param {string} value - New theme value
     */
    updateThemeSelector(value) {
        const selector = this.getElement('theme-select');
        if (selector) {
            selector.value = value;
        }
    },

    /**
     * Update location display
     * @param {string} locationName - Location name to display
     */
    updateLocationDisplay(locationName) {
        this.setText('location-display', locationName);
    }
};

// Prevent modifications to the DOMUtils object
Object.freeze(DOMUtils);