/**
 * The Book - Board Game Tracker
 * Main application entry point
 * 
 * This file initializes the application by coordinating the page modules:
 * - core.js: Shared state, data loading, navigation
 * - dashboard.js: Dashboard page (stats, charts, leaderboard, history)
 * - library.js: Library page (BGG integration, player profiles)
 * - log.js: Log game page
 * - awards.js: Awards calculation logic
 */

/**
 * Initialize the application
 */
function init() {
    // Initialize navigation (from core.js)
    initNavigation();
    
    // Initialize dashboard event listeners (from dashboard.js)
    if (typeof initDashboard === 'function') {
        initDashboard();
    }
    
    // Initialize log form (from log.js)
    if (typeof initLogForm === 'function') {
        initLogForm();
    }
    
    // Load data from Supabase (from core.js)
    loadData();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
