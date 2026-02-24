/**
 * The Book - Log Page
 * Game logging form functionality
 */

// Current players being added to the form
let currentPlayers = [];

/**
 * Initialize the log form
 */
function initLogForm() {
    const saveBtn = document.getElementById('save-game');
    const cancelBtn = document.getElementById('cancel-log');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const addPlayerInput = document.getElementById('add-player-input');
    
    if (saveBtn) saveBtn.addEventListener('click', saveGame);
    if (cancelBtn) cancelBtn.addEventListener('click', () => switchPage('home'));
    if (addPlayerBtn) addPlayerBtn.addEventListener('click', addPlayer);
    if (addPlayerInput) {
        addPlayerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addPlayer();
            }
        });
    }
}

/**
 * Reset the log form
 */
function resetForm() {
    const gameNameInput = document.getElementById('game-name');
    const winnerInput = document.getElementById('game-winner');
    const playerInput = document.getElementById('add-player-input');
    const statusDiv = document.getElementById('log-status');
    
    if (gameNameInput) gameNameInput.value = '';
    if (winnerInput) winnerInput.value = '';
    if (playerInput) playerInput.value = '';
    
    currentPlayers = [];
    renderPlayerChips();
    
    if (statusDiv) statusDiv.textContent = '';
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
    if (!container) return;
    
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
    
    if (gameSuggestions) {
        gameSuggestions.innerHTML = gameData.gameTypes
            .map(g => `<option value="${g}">`)
            .join('');
    }
    
    if (playerSuggestions) {
        playerSuggestions.innerHTML = gameData.players
            .map(p => `<option value="${p}">`)
            .join('');
    }
}

/**
 * Show log status message
 */
function showLogStatus(message, type) {
    const statusDiv = document.getElementById('log-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = type;
    }
}

/**
 * Save a new game
 */
async function saveGame() {
    const gameName = document.getElementById('game-name').value.trim().toLowerCase();
    const winnerInput = document.getElementById('game-winner').value.trim().toLowerCase();
    const statusDiv = document.getElementById('log-status');
    
    // Validation
    if (!gameName) {
        showLogStatus('Please enter a game name', 'error');
        return;
    }
    
    if (!winnerInput) {
        showLogStatus('Please enter a winner', 'error');
        return;
    }
    
    // Parse winners (support multiple via semicolon, comma, or "and")
    const winners = winnerInput
        .split(/[,;]|\band\b/i)
        .map(w => w.trim())
        .filter(w => w);
    
    // Ensure all winners are in players list
    let players = [...currentPlayers];
    winners.forEach(winner => {
        if (!players.includes(winner)) {
            players.push(winner);
        }
    });
    
    // Create game entry
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    const newGame = {
        date: dateStr,
        game: gameName,
        winner: winners.join('; '), // Store multiple winners semicolon-separated
        players: players.join('; ')
    };
    
    showLogStatus('Saving...', '');
    
    // Save to Supabase
    const { error } = await db
        .from('games')
        .insert([newGame]);
    
    if (error) {
        console.error('Error saving game:', error);
        showLogStatus('Error saving game. Check console.', 'error');
        return;
    }
    
    // Refresh display
    await loadData();
    
    // Show success and switch back to dashboard
    const winnerDisplay = winners.join(' & ');
    showLogStatus(`Logged: ${winnerDisplay} won ${gameName}!`, 'success');
    
    setTimeout(() => {
        resetForm();
        switchPage('dashboard');
    }, 1500);
}

// Make functions available globally for onclick handlers
window.removePlayer = removePlayer;
window.addPlayer = addPlayer;
window.saveGame = saveGame;
window.resetForm = resetForm;
window.updateSuggestions = updateSuggestions;
window.initLogForm = initLogForm;
