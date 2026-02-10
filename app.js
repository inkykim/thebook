/**
 * The Book - Board Game Tracker
 * Main application logic
 */

// Chart color palette
const COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
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

/**
 * Initialize the application
 */
function init() {
    const loadButton = document.getElementById('load-data');
    const loadSampleButton = document.getElementById('load-sample');
    const urlInput = document.getElementById('sheet-url');
    
    loadButton.addEventListener('click', loadData);
    loadSampleButton.addEventListener('click', loadSampleData);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadData();
    });
    
    // Try to load from localStorage
    const savedUrl = localStorage.getItem('sheetUrl');
    if (savedUrl) {
        urlInput.value = savedUrl;
    }
}

/**
 * Load sample data for demonstration
 */
async function loadSampleData() {
    showStatus('Loading sample data...', '');
    
    try {
        const response = await fetch('sample-data.csv');
        if (!response.ok) throw new Error('Failed to load sample data');
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        
        // Process the data
        processData(data);
        
        // Show sections and render
        showSections();
        renderAll();
        
        showStatus(`Loaded sample data: ${gameData.games.length} games with ${gameData.players.length} players`, 'success');
        
    } catch (error) {
        console.error('Error loading sample data:', error);
        showStatus('Error loading sample data. Try entering a Google Sheet URL instead.', 'error');
    }
}

/**
 * Load data from Google Sheets CSV
 */
async function loadData() {
    const urlInput = document.getElementById('sheet-url');
    const statusDiv = document.getElementById('data-status');
    let url = urlInput.value.trim();
    
    if (!url) {
        showStatus('Please enter a Google Sheets URL', 'error');
        return;
    }
    
    // Convert various Google Sheets URL formats to CSV export
    url = convertToCSVUrl(url);
    
    showStatus('Loading data...', '');
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        
        if (data.length === 0) {
            throw new Error('No data found in spreadsheet');
        }
        
        // Save URL for next time
        localStorage.setItem('sheetUrl', urlInput.value.trim());
        
        // Process the data
        processData(data);
        
        // Show sections and render
        showSections();
        renderAll();
        
        showStatus(`Loaded ${gameData.games.length} games with ${gameData.players.length} players`, 'success');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showStatus(`Error: ${error.message}. Make sure the sheet is published to web as CSV.`, 'error');
    }
}

/**
 * Convert Google Sheets URL to CSV export format
 */
function convertToCSVUrl(url) {
    // Already a CSV URL
    if (url.includes('output=csv')) return url;
    
    // Extract sheet ID from various formats
    const patterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/,
        /key=([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return `https://docs.google.com/spreadsheets/d/${match[1]}/pub?output=csv`;
        }
    }
    
    return url;
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
 * Expected columns: date, game, winner, players (comma-separated), [optional: notes, duration]
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
        const game = {
            id: index,
            date: row.date || row.Date || '',
            gameName: row.game || row.Game || row['game name'] || row['Game Name'] || '',
            winner: (row.winner || row.Winner || '').trim(),
            players: parsePlayerList(row.players || row.Players || row.winner || row.Winner || ''),
            notes: row.notes || row.Notes || '',
            duration: row.duration || row.Duration || ''
        };
        
        // Skip rows without essential data
        if (!game.gameName && !game.winner) return;
        
        // Ensure winner is in players list
        if (game.winner && !game.players.includes(game.winner)) {
            game.players.push(game.winner);
        }
        
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
            const won = game.winner === player;
            
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
 * Show status message
 */
function showStatus(message, type) {
    const statusDiv = document.getElementById('data-status');
    statusDiv.textContent = message;
    statusDiv.className = type;
}

/**
 * Show all data sections
 */
function showSections() {
    ['awards-section', 'stats-section', 'charts-section', 'leaderboard-section', 'history-section']
        .forEach(id => document.getElementById(id).classList.remove('hidden'));
}

/**
 * Render all visualizations
 */
function renderAll() {
    renderStats();
    renderAwards();
    renderCharts();
    renderLeaderboard();
    renderHistory();
}

/**
 * Render overview statistics
 */
function renderStats() {
    document.getElementById('total-games').textContent = gameData.games.length;
    document.getElementById('total-players').textContent = gameData.players.length;
    document.getElementById('unique-games').textContent = gameData.gameTypes.length;
    
    // Count unique sessions (by date)
    const uniqueDates = new Set(gameData.games.map(g => g.date).filter(d => d));
    document.getElementById('total-sessions').textContent = uniqueDates.size || gameData.games.length;
}

/**
 * Render awards
 */
function renderAwards() {
    const container = document.getElementById('awards-grid');
    const awards = calculateAwards(gameData);
    
    container.innerHTML = awards.map(award => `
        <div class="award-card">
            <div class="award-icon">${award.icon}</div>
            <div class="award-title">${award.name}</div>
            <div class="award-winner">${award.winner}</div>
            <div class="award-description">${award.description}</div>
            <div class="award-stat">${award.stat}</div>
        </div>
    `).join('');
}

/**
 * Render all charts
 */
function renderCharts() {
    renderWinsChart();
    renderWinRateChart();
    renderGamesDistributionChart();
    renderPopularGamesChart();
    renderTimelineChart();
}

/**
 * Render wins by player chart
 */
function renderWinsChart() {
    const ctx = document.getElementById('wins-chart').getContext('2d');
    
    const sortedPlayers = [...gameData.players]
        .sort((a, b) => gameData.playerStats[b].wins - gameData.playerStats[a].wins);
    
    if (charts.wins) charts.wins.destroy();
    
    charts.wins = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedPlayers,
            datasets: [{
                label: 'Wins',
                data: sortedPlayers.map(p => gameData.playerStats[p].wins),
                backgroundColor: COLORS.slice(0, sortedPlayers.length),
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Render win rate chart
 */
function renderWinRateChart() {
    const ctx = document.getElementById('winrate-chart').getContext('2d');
    
    const playersWithGames = gameData.players
        .filter(p => gameData.playerStats[p].gamesPlayed >= 3)
        .sort((a, b) => {
            const rateA = gameData.playerStats[a].wins / gameData.playerStats[a].gamesPlayed;
            const rateB = gameData.playerStats[b].wins / gameData.playerStats[b].gamesPlayed;
            return rateB - rateA;
        });
    
    if (charts.winrate) charts.winrate.destroy();
    
    charts.winrate = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: playersWithGames,
            datasets: [{
                label: 'Win Rate %',
                data: playersWithGames.map(p => {
                    const stats = gameData.playerStats[p];
                    return ((stats.wins / stats.gamesPlayed) * 100).toFixed(1);
                }),
                backgroundColor: COLORS.slice(0, playersWithGames.length),
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                        color: '#94a3b8',
                        callback: value => value + '%'
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Render games played distribution (pie chart)
 */
function renderGamesDistributionChart() {
    const ctx = document.getElementById('games-distribution-chart').getContext('2d');
    
    if (charts.distribution) charts.distribution.destroy();
    
    charts.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: gameData.players,
            datasets: [{
                data: gameData.players.map(p => gameData.playerStats[p].gamesPlayed),
                backgroundColor: COLORS.slice(0, gameData.players.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#f1f5f9' }
                }
            }
        }
    });
}

/**
 * Render most popular games chart
 */
function renderPopularGamesChart() {
    const ctx = document.getElementById('popular-games-chart').getContext('2d');
    
    // Count games
    const gameCounts = {};
    gameData.games.forEach(game => {
        gameCounts[game.gameName] = (gameCounts[game.gameName] || 0) + 1;
    });
    
    const sortedGames = Object.entries(gameCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (charts.popular) charts.popular.destroy();
    
    charts.popular = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedGames.map(g => g[0]),
            datasets: [{
                label: 'Times Played',
                data: sortedGames.map(g => g[1]),
                backgroundColor: COLORS.slice(0, sortedGames.length),
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Render wins over time chart
 */
function renderTimelineChart() {
    const ctx = document.getElementById('timeline-chart').getContext('2d');
    
    // Group wins by date for each player
    const dateWins = {};
    const sortedGames = [...gameData.games].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Initialize cumulative wins
    const cumulativeWins = {};
    gameData.players.forEach(p => cumulativeWins[p] = 0);
    
    sortedGames.forEach(game => {
        if (game.winner && game.date) {
            cumulativeWins[game.winner]++;
            
            if (!dateWins[game.date]) {
                dateWins[game.date] = { ...cumulativeWins };
            } else {
                dateWins[game.date] = { ...cumulativeWins };
            }
        }
    });
    
    const dates = Object.keys(dateWins).sort();
    
    if (charts.timeline) charts.timeline.destroy();
    
    // Only show top 5 players for clarity
    const topPlayers = [...gameData.players]
        .sort((a, b) => gameData.playerStats[b].wins - gameData.playerStats[a].wins)
        .slice(0, 5);
    
    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: topPlayers.map((player, i) => ({
                label: player,
                data: dates.map(date => dateWins[date][player] || 0),
                borderColor: COLORS[i],
                backgroundColor: COLORS[i] + '20',
                fill: false,
                tension: 0.3,
                pointRadius: 3
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#f1f5f9' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { 
                        color: '#94a3b8',
                        maxTicksLimit: 10
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Render leaderboard
 */
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    
    const sortedPlayers = [...gameData.players]
        .sort((a, b) => gameData.playerStats[b].wins - gameData.playerStats[a].wins);
    
    tbody.innerHTML = sortedPlayers.map((player, index) => {
        const stats = gameData.playerStats[player];
        const winRate = stats.gamesPlayed > 0 
            ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) + '%'
            : '-';
        
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1;
        
        return `
            <tr>
                <td class="${rankClass}">${rankEmoji}</td>
                <td><strong>${player}</strong></td>
                <td>${stats.wins}</td>
                <td>${stats.gamesPlayed}</td>
                <td>${winRate}</td>
                <td>${stats.currentStreak > 0 ? '🔥 ' + stats.currentStreak : '-'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Render recent game history
 */
function renderHistory() {
    const container = document.getElementById('game-history');
    
    // Show last 10 games
    const recentGames = [...gameData.games]
        .reverse()
        .slice(0, 10);
    
    container.innerHTML = recentGames.map(game => `
        <div class="game-entry">
            <div class="game-info">
                <span class="game-name">${game.gameName || 'Unknown Game'}</span>
                <span class="game-date">${game.date || 'No date'}</span>
            </div>
            <div>
                <span class="game-winner">🏆 ${game.winner || 'Unknown'}</span>
                <span class="game-players"> vs ${game.players.filter(p => p !== game.winner).join(', ') || 'N/A'}</span>
            </div>
        </div>
    `).join('');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
