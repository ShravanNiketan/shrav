// Toast notification system
const Toast = {
    /**
     * Initialize toast container
     */
    init() {
        // Create container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     * @param {string} options.title - Toast title
     * @param {string} options.message - Toast message
     * @param {string} [options.type='info'] - Toast type (info, success, warning)
     * @param {number} [options.duration=3000] - Duration in milliseconds
     */
    show({ title, message, type = 'info', duration = 3000 }) {
        this.init();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Set toast content
        toast.innerHTML = `
            <div class="toast-icon">
                ${this._getIcon(type)}
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Add to container
        const container = document.querySelector('.toast-container');
        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300); // Match transition duration
        }, duration);
    },

    /**
     * Get icon based on toast type
     * @private
     * @param {string} type - Toast type
     * @returns {string} Icon SVG
     */
    _getIcon(type) {
        switch (type) {
            case 'success':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            case 'warning':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            default: // info
                return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
    }
};

// Prevent modifications to the Toast object
Object.freeze(Toast);