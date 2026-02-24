/**
 * The Book - Core Module
 * Shared state, data loading, navigation, and utilities
 */

// Initialize Supabase client (exposed globally for use in other modules)
let db;
try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.db = db; // Make available globally
} catch (e) {
    console.error('Failed to initialize Supabase. Check your config.js');
}

// Realtime subscription
let realtimeChannel;

// Chart color palette - muted medieval colors
const COLORS = [
    '#8b7355', '#6b8b6b', '#7a6b5a', '#5a6e5a', '#8b6b4a',
    '#6a5d4d', '#5d6a5d', '#7a7060', '#686858', '#5a5a5a',
    '#6b6055', '#5d5d5d', '#6a6050', '#585850', '#4d4d4d'
];

// Store for loaded data
let gameData = {
    raw: [],
    games: [],
    players: [],
    playerStats: {},
    playerGameStats: {},
    gameTypes: []
};

// Chart instances
let charts = {};

// Current view state
let currentPage = 'home';
let libraryInitialized = false;

/**
 * Initialize navigation
 */
function initNavigation() {
    // Home page navigation buttons
    const homeNavBtns = document.querySelectorAll('.home-nav-btn');
    homeNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) {
                switchPage(page);
                if (page === 'log' && typeof updateSuggestions === 'function') {
                    updateSuggestions();
                }
            }
        });
    });
    
    // Page navigation buttons (on dashboard, library, log pages)
    const pageNavBtns = document.querySelectorAll('.page-nav-btn');
    pageNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) {
                // Update active states for all page nav buttons
                document.querySelectorAll('.page-nav-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.page === page);
                });
                switchPage(page);
                if (page === 'log' && typeof updateSuggestions === 'function') {
                    updateSuggestions();
                }
            }
        });
    });
    
    // Header title click to go home
    const headerTitles = document.querySelectorAll('.header-title');
    headerTitles.forEach(title => {
        title.addEventListener('click', () => {
            switchPage('home');
        });
    });
}

/**
 * Switch between pages (home, dashboard, library, log)
 */
function switchPage(page) {
    currentPage = page;
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // Show the target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Handle dashboard sections
    if (page === 'dashboard') {
        const dashboardSections = ['awards-section', 'stats-section', 'charts-section', 'leaderboard-section', 'history-section'];
        if (gameData.games && gameData.games.length > 0) {
            dashboardSections.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('hidden');
            });
        }
    }
    
    // Initialize library if navigating to it
    if (page === 'library' && !libraryInitialized) {
        libraryInitialized = true;
        if (typeof initLibrary === 'function') {
            initLibrary(
                gameData.gameTypes || [],
                gameData.games || [],
                gameData.playerStats || {},
                gameData.playerGameStats || {}
            );
        }
    }
}

// Keep switchView for backward compatibility
function switchView(view) {
    if (view === 'main') {
        switchPage('dashboard');
    } else {
        switchPage(view);
    }
}

/**
 * Load data from Supabase
 */
async function loadData() {
    console.log('Loading data from Supabase...');
    
    if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.log('Supabase not configured');
        showSetupMessage();
        return;
    }
    
    try {
        const { data, error } = await db
            .from('games')
            .select('*')
            .order('id', { ascending: true });
        
        console.log('Supabase response:', { data, error });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log(`Loaded ${data.length} games`);
            processData(data);
            showSections();
            renderAll();
            // Refresh library if viewing it
            if (currentPage === 'library') {
                refreshLibrary();
            }
        } else {
            console.log('No data found');
            showSections();
            processData([]);
            renderAll();
        }
        
        // Subscribe to realtime updates
        subscribeToUpdates();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showSetupMessage();
    }
}

/**
 * Subscribe to realtime updates from Supabase
 */
function subscribeToUpdates() {
    // Unsubscribe from existing channel if any
    if (realtimeChannel) {
        db.removeChannel(realtimeChannel);
    }
    
    // Subscribe to all changes on the games table AND bgg_cache table
    realtimeChannel = db
        .channel('all-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'games' },
            (payload) => {
                console.log('Games realtime update:', payload);
                // Reload all data when any change happens
                loadDataWithoutResubscribe();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bgg_cache' },
            (payload) => {
                console.log('BGG cache realtime update:', payload);
                // Refresh library when BGG data changes
                refreshLibraryOnly();
            }
        )
        .subscribe((status) => {
            console.log('Realtime subscription status:', status);
        });
}

/**
 * Load data without resubscribing (to avoid infinite loop)
 */
async function loadDataWithoutResubscribe() {
    try {
        const { data, error } = await db
            .from('games')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
            processData(data);
            showSections();
            renderAll();
            refreshLibrary();
        }
    } catch (error) {
        console.error('Error reloading data:', error);
    }
}

/**
 * Refresh the library view if it's been initialized
 */
function refreshLibrary() {
    if (libraryInitialized && typeof initLibrary === 'function') {
        // Clear BGG session cache to fetch fresh data
        if (typeof clearBGGSessionCache === 'function') {
            clearBGGSessionCache();
        }
        
        // Re-initialize library to fetch any new games
        initLibrary(
            gameData.gameTypes,
            gameData.games,
            gameData.playerStats,
            gameData.playerGameStats
        );
    }
}

/**
 * Refresh only the library view (for BGG cache updates)
 */
function refreshLibraryOnly() {
    if (libraryInitialized && currentPage === 'library' && typeof initLibrary === 'function') {
        console.log('Refreshing library due to BGG cache update...');
        initLibrary(
            gameData.gameTypes || [],
            gameData.games || [],
            gameData.playerStats || {},
            gameData.playerGameStats || {}
        );
    }
}

/**
 * Show setup message when Supabase is not configured
 */
function showSetupMessage() {
    const logSection = document.getElementById('log-section');
    if (logSection) {
        logSection.innerHTML = `
            <div class="setup-message">
                <h2>⚙️ Setup Required</h2>
                <p>To use The Book, you need to configure Supabase:</p>
                <ol>
                    <li>Create a free account at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
                    <li>Create a new project</li>
                    <li>Create a <code>games</code> table (see README for SQL)</li>
                    <li>Edit <code>config.js</code> with your project URL and anon key</li>
                </ol>
                <p>See the <a href="https://github.com/YOUR_USERNAME/thebook#setup" target="_blank">README</a> for detailed instructions.</p>
            </div>
        `;
    }
}

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

/**
 * Process raw data into structured game data
 */
function processData(rawData) {
    gameData.raw = rawData;
    gameData.games = [];
    gameData.players = new Set();
    gameData.playerStats = {};
    gameData.playerGameStats = {};
    gameData.gameTypes = new Set();
    
    // Process each row
    rawData.forEach((row, index) => {
        // Flexible column detection
        const winnerRaw = row.winner || row.Winner || '';
        const winners = parsePlayerList(winnerRaw);
        
        const game = {
            id: index,
            date: row.date || row.Date || '',
            gameName: row.game || row.Game || row['game name'] || row['Game Name'] || '',
            winner: winnerRaw.trim(), // Keep original string for backward compatibility
            winners: winners, // Array of winners for multi-winner support
            players: parsePlayerList(row.players || row.Players || row.winner || row.Winner || ''),
            notes: row.notes || row.Notes || '',
            duration: row.duration || row.Duration || ''
        };
        
        // Skip rows without essential data
        if (!game.gameName && !game.winner) return;
        
        // Ensure all winners are in players list
        game.winners.forEach(winner => {
            if (winner && !game.players.includes(winner)) {
                game.players.push(winner);
            }
        });
        
        gameData.games.push(game);
        gameData.gameTypes.add(game.gameName);
        
        // Track all players
        game.players.forEach(player => gameData.players.add(player));
    });
    
    // Convert Sets to Arrays
    gameData.players = Array.from(gameData.players).filter(p => p);
    gameData.gameTypes = Array.from(gameData.gameTypes).filter(g => g);
    
    // Calculate player statistics
    calculatePlayerStats();
}

/**
 * Parse player list from various formats
 */
function parsePlayerList(playersStr) {
    if (!playersStr) return [];
    
    // Split by comma, semicolon, or "and"
    return playersStr
        .split(/[,;]|\band\b/i)
        .map(p => p.trim())
        .filter(p => p);
}

/**
 * Calculate comprehensive player statistics
 */
function calculatePlayerStats() {
    const { games, players } = gameData;
    
    // Initialize stats for each player
    players.forEach(player => {
        gameData.playerStats[player] = {
            wins: 0,
            gamesPlayed: 0,
            gamesPlayed_list: [],
            gamesWon: [],
            currentStreak: 0,
            longestStreak: 0,
            results: [] // Track win/loss sequence
        };
        gameData.playerGameStats[player] = {};
    });
    
    // Process games chronologically
    const sortedGames = [...games].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
    
    sortedGames.forEach(game => {
        game.players.forEach(player => {
            if (!gameData.playerStats[player]) return;
            
            const stats = gameData.playerStats[player];
            // Support multiple winners: check if player is in winners array
            const won = game.winners && game.winners.includes(player);
            
            stats.gamesPlayed++;
            stats.gamesPlayed_list.push(game.gameName);
            stats.results.push(won);
            
            if (won) {
                stats.wins++;
                stats.gamesWon.push(game.gameName);
                stats.currentStreak++;
                if (stats.currentStreak > stats.longestStreak) {
                    stats.longestStreak = stats.currentStreak;
                }
            } else {
                stats.currentStreak = 0;
            }
            
            // Per-game stats
            if (!gameData.playerGameStats[player][game.gameName]) {
                gameData.playerGameStats[player][game.gameName] = { wins: 0, played: 0 };
            }
            gameData.playerGameStats[player][game.gameName].played++;
            if (won) {
                gameData.playerGameStats[player][game.gameName].wins++;
            }
        });
    });
}

/**
 * Show all data sections
 */
function showSections() {
    ['awards-section', 'stats-section', 'charts-section', 'leaderboard-section', 'history-section']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });
}

/**
 * Render all visualizations (calls page-specific render functions)
 */
function renderAll() {
    if (typeof renderStats === 'function') renderStats();
    if (typeof renderAwards === 'function') renderAwards();
    if (typeof renderCharts === 'function') renderCharts();
    if (typeof renderLeaderboard === 'function') renderLeaderboard();
    if (typeof renderHistory === 'function') renderHistory();
}

/**
 * Parse date string to Date object (handles M/D/YYYY format)
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    // Handle M/D/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    return new Date(dateStr);
}

/**
 * Check if a player won a game (supports multiple winners)
 * @param {Object} game - The game object
 * @param {string} player - The player name to check
 * @returns {boolean} - True if the player won
 */
function isWinner(game, player) {
    if (game.winners && Array.isArray(game.winners)) {
        return game.winners.includes(player);
    }
    return game.winner === player;
}

/**
 * Get winners array from a game (handles both old and new format)
 * @param {Object} game - The game object
 * @returns {Array} - Array of winner names
 */
function getWinners(game) {
    if (game.winners && Array.isArray(game.winners)) {
        return game.winners;
    }
    return game.winner ? [game.winner] : [];
}

// Expose globals for other modules
window.db = db;
window.gameData = gameData;
window.charts = charts;
window.COLORS = COLORS;
window.currentPage = currentPage;
window.switchPage = switchPage;
window.switchView = switchView;
window.loadData = loadData;
window.parseDate = parseDate;
window.refreshLibraryOnly = refreshLibraryOnly;
window.refreshLibrary = refreshLibrary;
window.isWinner = isWinner;
window.getWinners = getWinners;
