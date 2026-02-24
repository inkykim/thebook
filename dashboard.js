/**
 * The Book - Dashboard Page
 * Stats, charts, awards, leaderboard, and game history
 */

// Edit mode state
let editMode = false;

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
async function renderAwards() {
    const container = document.getElementById('awards-grid');
    if (!container) return;
    
    const awards = calculateAwards(gameData);
    
    // Fetch all SVG icons and inline them so currentColor works
    const awardsWithIcons = await Promise.all(awards.map(async (award) => {
        if (award.iconPath) {
            try {
                const response = await fetch(award.iconPath);
                const svgContent = await response.text();
                // Add the class to the SVG element
                award.inlineSvg = svgContent.replace('<svg', '<svg class="award-icon-svg"');
            } catch (e) {
                award.inlineSvg = award.icon; // Fallback to text icon
            }
        }
        return award;
    }));
    
    container.innerHTML = awardsWithIcons.map(award => `
        <div class="award-card">
            <div class="award-icon">
                ${award.inlineSvg || award.icon}
            </div>
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
    const canvas = document.getElementById('wins-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
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
                borderRadius: 4
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
                    ticks: { color: '#7a7468' },
                    grid: { color: '#2a2622' }
                },
                x: {
                    ticks: { color: '#7a7468' },
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
    const canvas = document.getElementById('winrate-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
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
                borderRadius: 4
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
                        color: '#7a7468',
                        callback: value => value + '%'
                    },
                    grid: { color: '#2a2622' }
                },
                x: {
                    ticks: { color: '#7a7468' },
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
    const canvas = document.getElementById('games-distribution-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
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
                    labels: { color: '#c9c2b5' }
                }
            }
        }
    });
}

/**
 * Render most popular games chart
 */
function renderPopularGamesChart() {
    const canvas = document.getElementById('popular-games-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
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
                borderRadius: 4
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
                    ticks: { color: '#7a7468' },
                    grid: { color: '#2a2622' }
                },
                y: {
                    ticks: { color: '#7a7468' },
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
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Sort games by date chronologically
    const sortedGames = [...gameData.games]
        .filter(g => g.date)
        .sort((a, b) => parseDate(a.date) - parseDate(b.date));
    
    if (sortedGames.length === 0) {
        if (charts.timeline) charts.timeline.destroy();
        return;
    }
    
    // Get unique dates in chronological order
    const uniqueDates = [...new Set(sortedGames.map(g => g.date))]
        .sort((a, b) => parseDate(a) - parseDate(b));
    
    // Only show top 5 players for clarity
    const topPlayers = [...gameData.players]
        .sort((a, b) => gameData.playerStats[b].wins - gameData.playerStats[a].wins)
        .slice(0, 5);
    
    // Build data: start at 0, then show cumulative after each date
    const chartLabels = ['Start', ...uniqueDates];
    const playerData = {};
    topPlayers.forEach(p => playerData[p] = [0]); // Everyone starts at 0
    
    // Track cumulative wins
    const cumulativeWins = {};
    topPlayers.forEach(p => cumulativeWins[p] = 0);
    
    // Process each date chronologically
    uniqueDates.forEach(date => {
        // Get all games on this date and update cumulative wins
        sortedGames
            .filter(g => g.date === date)
            .forEach(game => {
                // Support multiple winners
                const winners = game.winners || (game.winner ? [game.winner] : []);
                winners.forEach(winner => {
                    if (winner && cumulativeWins.hasOwnProperty(winner)) {
                        cumulativeWins[winner]++;
                    }
                });
            });
        
        // Add data point for this date
        topPlayers.forEach(p => playerData[p].push(cumulativeWins[p]));
    });
    
    if (charts.timeline) charts.timeline.destroy();
    
    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: topPlayers.map((player, i) => ({
                label: player,
                data: playerData[player],
                borderColor: COLORS[i],
                backgroundColor: COLORS[i] + '20',
                fill: false,
                tension: 0.3,
                pointRadius: 4
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#c9c2b5' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#7a7468',
                        stepSize: 1
                    },
                    grid: { color: '#2a2622' }
                },
                x: {
                    ticks: { 
                        color: '#7a7468',
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
    if (!tbody) return;
    
    // Use tiebreaker sorting: total wins, win rate, variety of games won
    let sortedEntries;
    if (typeof window.sortPlayersWithTiebreakers === 'function') {
        // Convert players to [name, stats] entries for the sorting function
        const playerEntries = gameData.players.map(p => [p, gameData.playerStats[p]]);
        sortedEntries = window.sortPlayersWithTiebreakers(playerEntries, gameData.games || []);
    } else {
        // Fallback to simple wins sort
        sortedEntries = gameData.players
            .map(p => [p, gameData.playerStats[p]])
            .sort((a, b) => b[1].wins - a[1].wins);
    }
    
    // Calculate ranks accounting for ties
    const ranks = [];
    let currentRank = 1;
    
    for (let i = 0; i < sortedEntries.length; i++) {
        if (i === 0) {
            ranks.push(currentRank);
        } else {
            const prevStats = sortedEntries[i - 1][1];
            const currStats = sortedEntries[i][1];
            
            // Check if truly tied using comparePlayers if available
            let isTied = false;
            if (typeof window.comparePlayers === 'function') {
                isTied = window.comparePlayers(prevStats, currStats) === 0;
            } else {
                // Fallback: just compare wins
                isTied = prevStats.wins === currStats.wins;
            }
            
            if (isTied) {
                ranks.push(ranks[i - 1]); // Same rank as previous
            } else {
                currentRank = i + 1; // Rank jumps to position
                ranks.push(currentRank);
            }
        }
    }
    
    tbody.innerHTML = sortedEntries.map(([player, stats], index) => {
        const winRate = stats.gamesPlayed > 0 
            ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) + '%'
            : '-';
        
        const rank = ranks[index];
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const rankDisplay = rank === 1 ? 'I' : rank === 2 ? 'II' : rank === 3 ? 'III' : rank;
        
        // Get player profile for avatar
        const profile = typeof window.getPlayerProfile === 'function' ? window.getPlayerProfile(player) : null;
        const avatarUrl = profile?.avatarUrl;
        const initial = player.charAt(0).toUpperCase();
        
        const avatarHtml = avatarUrl
            ? `<span class="player-avatar player-avatar-sm has-image"><img src="${avatarUrl}" alt="${player}" class="player-avatar-img"></span>`
            : `<span class="player-avatar player-avatar-sm">${initial}</span>`;
        
        // Format streak as Wn or Ln with appropriate styling
        let streakDisplay = '-';
        let streakClass = '';
        if (stats.currentStreak > 0 && stats.currentStreakType) {
            streakDisplay = `${stats.currentStreakType}${stats.currentStreak}`;
            streakClass = stats.currentStreakType === 'W' ? 'streak-win' : 'streak-loss';
        }
        
        return `
            <tr>
                <td class="${rankClass}">${rankDisplay}</td>
                <td class="leaderboard-player-cell">${avatarHtml}<strong>${player}</strong></td>
                <td>${stats.wins}</td>
                <td>${stats.gamesPlayed}</td>
                <td>${winRate}</td>
                <td class="${streakClass}">${streakDisplay}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Render game history with edit capabilities
 */
function renderHistory() {
    const container = document.getElementById('game-history');
    if (!container) return;
    
    // Show all games (reversed so newest first)
    const allGames = [...gameData.raw].reverse();
    
    container.innerHTML = allGames.map((game, displayIndex) => {
        const gameId = game.id;
        const playersStr = game.players || '';
        const playersArr = playersStr.split(/[,;]/).map(p => p.trim()).filter(p => p);
        // Support multiple winners
        const winnersArr = (game.winner || '').split(/[,;]/).map(p => p.trim()).filter(p => p);
        const winnersDisplay = winnersArr.join(' & ') || 'Unknown';
        const otherPlayers = playersArr.filter(p => !winnersArr.includes(p));
        
        return `
        <div class="game-entry">
            <div class="game-display">
                <div class="game-info">
                    <span class="game-name">${game.game || 'Unknown Game'}</span>
                    <span class="game-date">${game.date || 'No date'}</span>
                </div>
                <div>
                    <span class="game-winner">🏆 ${winnersDisplay}</span>
                    <span class="game-players">${otherPlayers.length > 0 ? ' vs ' + otherPlayers.join(', ') : ''}</span>
                </div>
            </div>
            <div class="edit-inputs">
                <input type="text" class="edit-date" value="${game.date || ''}" placeholder="Date" style="width: 100px">
                <input type="text" class="edit-game" value="${game.game || ''}" placeholder="Game">
                <input type="text" class="edit-winner" value="${game.winner || ''}" placeholder="Winner(s) (semicolon-sep)">
                <input type="text" class="edit-players" value="${playersStr}" placeholder="Players (semicolon-sep)" style="width: 200px">
                <button class="btn btn-primary btn-icon" onclick="saveEditedGame(${gameId}, ${displayIndex})">Save</button>
                <button class="btn btn-secondary btn-icon" onclick="cancelEdit(${displayIndex})">Cancel</button>
            </div>
            <div class="game-actions">
                <button class="btn btn-secondary btn-icon" onclick="editGame(${displayIndex})">✏️</button>
                <button class="btn btn-danger btn-icon" onclick="deleteGame(${gameId})">🗑️</button>
            </div>
        </div>
    `}).join('');
    
    // Maintain edit mode class if active
    if (editMode) {
        container.classList.add('edit-mode');
    }
}

/**
 * Toggle edit mode for game history
 */
function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('toggle-edit-mode');
    const historySection = document.getElementById('game-history');
    
    if (editMode) {
        btn.textContent = 'Done';
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
        historySection.classList.add('edit-mode');
    } else {
        btn.textContent = 'Edit';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        historySection.classList.remove('edit-mode');
    }
    
    renderHistory();
}

/**
 * Delete a game by ID
 */
async function deleteGame(id) {
    if (!confirm('Delete this game?')) return;
    
    const { error } = await db
        .from('games')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting game:', error);
        alert('Error deleting game');
        return;
    }
    
    // Refresh display
    await loadData();
}

/**
 * Start editing a game
 */
function editGame(index) {
    const entries = document.querySelectorAll('.game-entry');
    entries.forEach((entry, i) => {
        if (i === index) {
            entry.classList.add('editing');
        } else {
            entry.classList.remove('editing');
        }
    });
}

/**
 * Save edited game
 */
async function saveEditedGame(id, displayIndex) {
    const entries = document.querySelectorAll('.game-entry');
    const entry = entries[displayIndex];
    const dateInput = entry.querySelector('.edit-date');
    const gameInput = entry.querySelector('.edit-game');
    const winnerInput = entry.querySelector('.edit-winner');
    const playersInput = entry.querySelector('.edit-players');
    
    const { error } = await db
        .from('games')
        .update({
            date: dateInput.value,
            game: gameInput.value.toLowerCase(),
            winner: winnerInput.value.toLowerCase(),
            players: playersInput.value
        })
        .eq('id', id);
    
    if (error) {
        console.error('Error updating game:', error);
        alert('Error updating game');
        return;
    }
    
    // Refresh display
    await loadData();
}

/**
 * Cancel editing a game
 */
function cancelEdit(index) {
    const entries = document.querySelectorAll('.game-entry');
    entries[index].classList.remove('editing');
    renderHistory();
}

/**
 * Initialize dashboard event listeners
 */
function initDashboard() {
    const editModeBtn = document.getElementById('toggle-edit-mode');
    if (editModeBtn) {
        editModeBtn.addEventListener('click', toggleEditMode);
    }
}

// Make functions available globally for onclick handlers
window.deleteGame = deleteGame;
window.editGame = editGame;
window.saveEditedGame = saveEditedGame;
window.cancelEdit = cancelEdit;
window.renderStats = renderStats;
window.renderAwards = renderAwards;
window.renderCharts = renderCharts;
window.renderLeaderboard = renderLeaderboard;
window.renderHistory = renderHistory;
window.initDashboard = initDashboard;
