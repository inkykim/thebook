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

// Current players being added to the form
let currentPlayers = [];

/**
 * Initialize the application
 */
function init() {
    // Log form controls
    const toggleBtn = document.getElementById('toggle-log-form');
    const saveBtn = document.getElementById('save-game');
    const cancelBtn = document.getElementById('cancel-log');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const addPlayerInput = document.getElementById('add-player-input');
    
    toggleBtn.addEventListener('click', toggleLogForm);
    saveBtn.addEventListener('click', saveGame);
    cancelBtn.addEventListener('click', hideLogForm);
    addPlayerBtn.addEventListener('click', addPlayer);
    addPlayerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPlayer();
        }
    });
    
    // Load data from localStorage or sample data
    loadData();
}

/**
 * Toggle the log form visibility
 */
function toggleLogForm() {
    const form = document.getElementById('log-form');
    const btn = document.getElementById('toggle-log-form');
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        btn.textContent = '− Cancel';
        updateSuggestions();
    } else {
        hideLogForm();
    }
}

/**
 * Hide the log form and reset it
 */
function hideLogForm() {
    const form = document.getElementById('log-form');
    const btn = document.getElementById('toggle-log-form');
    
    form.classList.add('hidden');
    btn.textContent = '+ Log Game';
    resetForm();
}

/**
 * Reset the log form
 */
function resetForm() {
    document.getElementById('game-name').value = '';
    document.getElementById('game-winner').value = '';
    document.getElementById('add-player-input').value = '';
    currentPlayers = [];
    renderPlayerChips();
    document.getElementById('log-status').textContent = '';
}

/**
 * Add a player to the current game
 */
function addPlayer() {
    const input = document.getElementById('add-player-input');
    const name = input.value.trim().toLowerCase();
    
    if (name && !currentPlayers.includes(name)) {
        currentPlayers.push(name);
        renderPlayerChips();
    }
    
    input.value = '';
    input.focus();
}

/**
 * Remove a player from the current game
 */
function removePlayer(name) {
    currentPlayers = currentPlayers.filter(p => p !== name);
    renderPlayerChips();
}

/**
 * Render player chips in the form
 */
function renderPlayerChips() {
    const container = document.getElementById('player-chips');
    
    container.innerHTML = currentPlayers.map(player => `
        <span class="player-chip">
            ${player}
            <span class="remove-player" onclick="removePlayer('${player}')">×</span>
        </span>
    `).join('');
}

/**
 * Update autocomplete suggestions based on existing data
 */
function updateSuggestions() {
    const gameSuggestions = document.getElementById('game-suggestions');
    const playerSuggestions = document.getElementById('player-suggestions');
    
    gameSuggestions.innerHTML = gameData.gameTypes
        .map(g => `<option value="${g}">`)
        .join('');
    
    playerSuggestions.innerHTML = gameData.players
        .map(p => `<option value="${p}">`)
        .join('');
}

/**
 * Save a new game
 */
function saveGame() {
    const gameName = document.getElementById('game-name').value.trim().toLowerCase();
    const winner = document.getElementById('game-winner').value.trim().toLowerCase();
    const statusDiv = document.getElementById('log-status');
    
    // Validation
    if (!gameName) {
        statusDiv.textContent = 'Please enter a game name';
        statusDiv.className = 'error';
        return;
    }
    
    if (!winner) {
        statusDiv.textContent = 'Please enter a winner';
        statusDiv.className = 'error';
        return;
    }
    
    // Ensure winner is in players list
    let players = [...currentPlayers];
    if (!players.includes(winner)) {
        players.push(winner);
    }
    
    // Create game entry
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    const newGame = {
        date: dateStr,
        game: gameName,
        winner: winner,
        players: players.join('; ')
    };
    
    // Load existing games, add new one, save
    const savedGames = JSON.parse(localStorage.getItem('gameData') || '[]');
    savedGames.push(newGame);
    localStorage.setItem('gameData', JSON.stringify(savedGames));
    
    // Refresh display
    processData(savedGames);
    renderAll();
    
    // Show success and hide form
    statusDiv.textContent = `✓ Logged: ${winner} won ${gameName}!`;
    statusDiv.className = 'success';
    
    setTimeout(() => {
        hideLogForm();
    }, 1500);
}

/**
 * Load data from localStorage or sample data
 */
async function loadData() {
    // Check for saved games in localStorage
    const savedGames = JSON.parse(localStorage.getItem('gameData') || '[]');
    
    if (savedGames.length > 0) {
        // Use saved data
        processData(savedGames);
        showSections();
        renderAll();
    } else {
        // Load sample data for first-time users
        try {
            const response = await fetch('sample-data.csv');
            if (response.ok) {
                const csvText = await response.text();
                const data = parseCSV(csvText);
                
                // Save sample data to localStorage
                localStorage.setItem('gameData', JSON.stringify(data));
                
                processData(data);
                showSections();
                renderAll();
            }
        } catch (error) {
            console.log('No sample data available, starting fresh');
            showSections();
        }
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
 * Show log status message
 */
function showLogStatus(message, type) {
    const statusDiv = document.getElementById('log-status');
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

// Make removePlayer available globally for onclick handlers
window.removePlayer = removePlayer;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
