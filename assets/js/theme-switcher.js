// Theme switching functionality
class ThemeController {
    constructor() {
        this.themeSelect = document.getElementById('theme-select');
        this.currentTheme = localStorage.getItem('theme') || 'system';
        this.timeBasedInterval = null;

        // Initialize
        this.init();
    }

    init() {
        // Set initial value of select
        this.themeSelect.value = this.currentTheme;

        // Add event listener for theme changes
        this.themeSelect.addEventListener('change', () => this.handleThemeChange());

        // Apply initial theme
        this.applyTheme(this.currentTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
            if (this.currentTheme === 'system') {
                this.applySystemTheme();
            }
        });
    }

    handleThemeChange() {
        const newTheme = this.themeSelect.value;
        this.currentTheme = newTheme;
        localStorage.setItem('theme', newTheme);
        this.applyTheme(newTheme);
    }

    applyTheme(theme) {
        // Clear any existing time-based interval
        if (this.timeBasedInterval) {
            clearInterval(this.timeBasedInterval);
            this.timeBasedInterval = null;
        }

        switch (theme) {
            case 'light':
                this.setTheme('light');
                break;
            case 'dark':
                this.setTheme('dark');
                break;
            case 'system':
                this.applySystemTheme();
                break;
            case 'auto':
                this.applyTimeBasedTheme();
                break;
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    applySystemTheme() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(isDarkMode ? 'dark' : 'light');
    }

    applyTimeBasedTheme() {
        const updateTimeBasedTheme = () => {
            const hour = new Date().getHours();
            // Dark mode between 6 PM (18:00) and 6 AM (6:00)
            this.setTheme(hour >= 18 || hour < 6 ? 'dark' : 'light');
        };

        // Update immediately
        updateTimeBasedTheme();

        // Update every minute
        this.timeBasedInterval = setInterval(updateTimeBasedTheme, 60000);
    }
}

// Initialize theme controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeController();
});