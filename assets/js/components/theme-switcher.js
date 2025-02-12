// Theme Switcher Component
class ThemeSwitcher {
    constructor() {
        console.log('ThemeSwitcher: Initializing...'); // Debug log

        // Initialize properties
        this.visualTheme = StorageService.getTheme() || 'dark';
        this.selectedTheme = StorageService.getTheme() || '';  // Empty string for "Select Theme"
        console.log('ThemeSwitcher: Initial theme -', this.visualTheme);
        
        this.themeUpdateTimer = null;
        this.naturalThemeController = null;
        this.defaultOptions = this._getDefaultOptions();
        this.resetOptions = this._getResetOptions();

        // Bind methods to maintain context
        this.handleThemeChange = this.handleThemeChange.bind(this);
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
        this.initializeTheme = this.initializeTheme.bind(this);
        this.updateParticlesBackground = this.updateParticlesBackground.bind(this);

        // Initialize
        this.init();
    }

    /**
     * Get default theme options array
     * @private
     * @returns {Array} Array of theme option objects
     */
    _getDefaultOptions() {
        return [
            { value: '', label: 'Select Theme' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
            { value: 'natural', label: 'Natural' }
        ];
    }

    /**
     * Get theme options array with reset option
     * @private
     * @returns {Array} Array of theme option objects
     */
    _getResetOptions() {
        return [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
            { value: 'natural', label: 'Natural' },
            { value: 'reset', label: 'Reset' }
        ];
    }

    /**
     * Update select element options
     * @private
     * @param {Array} options - Array of option objects
     */
    _updateSelectOptions(options) {
        const select = this.themeSelect;
        if (!select) return;

        // Clear existing options
        select.innerHTML = '';

        // Add new options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            select.appendChild(optionElement);
        });
    }

    /**
     * Initialize theme switcher
     */
    async init() {
        console.log('ThemeSwitcher: Running init...'); // Debug log

        // Set up system theme detection
        this.systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemThemeMedia.addListener(this.handleSystemThemeChange);

        // Set up DOM elements
        this.setupDOMElements();

        // Set up event listeners
        this.setupEventListeners();

        // Initialize theme
        await this.initializeTheme();
    }

    /**
     * Set up DOM element references
     */
    setupDOMElements() {
        console.log('ThemeSwitcher: Setting up DOM elements...'); // Debug log
        this.themeSelect = DOMUtils.getElement('theme-select');
        this.themeLocation = DOMUtils.getElement('theme-location');
        this.changeLocationBtn = DOMUtils.getElement('change-location');

        // Log if elements were found
        console.log('ThemeSwitcher: Theme select found -', !!this.themeSelect);
        console.log('ThemeSwitcher: Theme location found -', !!this.themeLocation);
        console.log('ThemeSwitcher: Change location button found -', !!this.changeLocationBtn);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        console.log('ThemeSwitcher: Setting up event listeners...'); // Debug log
        if (this.themeSelect) {
            DOMUtils.addListener('theme-select', 'change', this.handleThemeChange);
            console.log('ThemeSwitcher: Theme change listener added');
        }
        
        if (this.changeLocationBtn) {
            DOMUtils.addListener('change-location', 'click', () => {
                if (this.naturalThemeController) {
                    this.naturalThemeController.showLocationModal();
                }
            });
            console.log('ThemeSwitcher: Location change listener added');
        }
    }

    /**
     * Initialize theme based on stored preference
     */
    async initializeTheme() {
        console.log('ThemeSwitcher: Initializing theme...'); // Debug log
        
        // Set initial options and value
        if (this.themeSelect) {
            // Use reset options if a theme is selected, otherwise use default options
            const options = this.selectedTheme ? this.resetOptions : this.defaultOptions;
            this._updateSelectOptions(options);
            this.themeSelect.value = this.selectedTheme;
            console.log('ThemeSwitcher: Updated selector to -', this.selectedTheme);
        }
        
        // Apply the visual theme
        await this.applyTheme(this.visualTheme);
    }

    /**
     * Handle theme selection change
     * @param {Event} event - Change event
     */
    async handleThemeChange(event) {
        console.log('Theme change triggered:', event.target.value);
        const newTheme = event.target.value;
        
        // Handle reset action
        if (newTheme === 'reset') {
            console.log('Reset action triggered');
            await this.resetTheme();
            return;
        }

        try {
            this.selectedTheme = newTheme;
            this.visualTheme = newTheme || 'dark';
            console.log('Updating theme to:', this.visualTheme);
            StorageService.setTheme(newTheme);

            if (newTheme === 'natural') {
                console.log('Natural theme selected, showing modal');
                if (!this.naturalThemeController) {
                    console.log('Creating new natural theme controller');
                    this.naturalThemeController = new NaturalTheme(this.setTheme.bind(this));
                }
                // Show modal first, then update options after location is set
                this.naturalThemeController.showLocationModal();
            } else {
                await this.applyTheme(this.visualTheme);
                if (newTheme) {
                    console.log('Updating options to show reset');
                    this._updateSelectOptions(this.resetOptions);
                    this.themeSelect.value = newTheme;
                }
            }
        } catch (error) {
            console.error('Theme change error:', error);
            // Revert the theme selection if there's an error
            this.selectedTheme = '';
            this.visualTheme = 'dark';
            this.themeSelect.value = '';
            this._updateSelectOptions(this.defaultOptions);
        }
    }

    /**
     * Reset theme to default state
     * @private
     */
    async resetTheme() {
        console.log('Starting theme reset');
        
        // Clear all theme-related storage
        StorageService.remove(StorageService.keys.THEME);
        StorageService.remove(StorageService.keys.LOCATION);
        StorageService.remove(StorageService.keys.SUN_DATA);
        
        // Force cleanup of natural theme
        if (this.naturalThemeController) {
            console.log('Cleaning up natural theme controller');
            this.naturalThemeController.cleanup();
            this.naturalThemeController = null;
        }

        // Reset UI state
        console.log('Resetting UI state');
        this.selectedTheme = '';
        this.visualTheme = 'dark';
        await this.applyTheme('dark');
        
        // Update selector options and value
        this._updateSelectOptions(this.defaultOptions);
        if (this.themeSelect) {
            this.themeSelect.value = '';
        }

        Toast.show({
            title: 'Theme Reset',
            message: 'Theme preferences have been reset to default',
            type: 'success',
            duration: 3000
        });

        console.log('Theme reset complete');
    }

    /**
     * Handle system theme changes
     */
    async handleSystemThemeChange() {
        console.log('ThemeSwitcher: System theme change detected'); // Debug log
        if (this.currentTheme === 'system') {
            await this.applySystemTheme();
        }
    }

    /**
     * Apply selected theme
     * @param {string} theme - Theme to apply
     */
    async applyTheme(theme) {
        console.log('ThemeSwitcher: Applying theme -', theme); // Debug log

        // Clear any existing theme update timer
        if (this.themeUpdateTimer) {
            clearTimeout(this.themeUpdateTimer);
            this.themeUpdateTimer = null;
        }

        // Clean up previous natural theme controller if exists
        if (this.naturalThemeController) {
            this.naturalThemeController.cleanup();
            this.naturalThemeController = null;
        }

        // Apply theme based on selection
        switch (theme) {
            case 'light':
                this.setTheme('light');
                DOMUtils.hideElement('theme-location');
                break;

            case 'dark':
                this.setTheme('dark');
                DOMUtils.hideElement('theme-location');
                break;

            case 'system':
                await this.applySystemTheme();
                DOMUtils.hideElement('theme-location');
                break;

            case 'natural':
                // Initialize natural theme controller
                this.naturalThemeController = new NaturalTheme(this.setTheme.bind(this));
                await this.naturalThemeController.initialize();
                DOMUtils.showElement('theme-location');
                break;

            default:
                console.error('Invalid theme:', theme);
                this.setTheme('system');
                break;
        }
    }

    /**
     * Apply system theme preference
     */
    async applySystemTheme() {
        const isDarkMode = this.systemThemeMedia.matches;
        console.log('ThemeSwitcher: System theme is dark mode -', isDarkMode); // Debug log
        this.setTheme(isDarkMode ? 'dark' : 'light');
    }

    /**
     * Set theme on document and update background
     * @param {string} theme - Theme to set
     */
    setTheme(theme) {
        console.log('ThemeSwitcher: Setting theme -', theme); // Debug log
        document.documentElement.setAttribute('data-theme', theme);
        this.updateParticlesBackground(theme);
    }

    /**
     * Update particles.js background based on theme
     * @param {string} theme - Current theme
     */
    updateParticlesBackground(theme) {
        console.log('ThemeSwitcher: Updating particles background for theme -', theme); // Debug log
        const particlesContainer = DOMUtils.getElement('particles-js');
        if (!particlesContainer) {
            console.log('ThemeSwitcher: Particles container not found'); // Debug log
            return;
        }

        if (theme === 'light') {
            particlesContainer.style.background = 'radial-gradient(circle at center, rgb(186, 186, 189) 0%, rgb(255, 255, 255) 100%)';
        } else {
            particlesContainer.style.background = 'radial-gradient(circle at center, #0a0619 0%, #000000 100%)';
        }
    }

    /**
     * Clean up theme switcher
     */
    cleanup() {
        console.log('ThemeSwitcher: Cleaning up...'); // Debug log
        // Remove event listeners
        this.systemThemeMedia.removeListener(this.handleSystemThemeChange);
        DOMUtils.removeListener('theme-select', 'change', this.handleThemeChange);
        
        // Clear any running timers
        if (this.themeUpdateTimer) {
            clearTimeout(this.themeUpdateTimer);
        }

        // Clean up natural theme controller if exists
        if (this.naturalThemeController) {
            this.naturalThemeController.cleanup();
        }
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing ThemeSwitcher'); // Debug log
    window.themeSwitcher = new ThemeSwitcher();
});