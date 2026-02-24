/**
 * BoardGameGeek Data Integration
 * Reads BGG game data from Supabase cache
 * 
 * SETUP: Run this SQL in your Supabase SQL Editor to create the bgg_cache table:
 * 
 * CREATE TABLE bgg_cache (
 *   id SERIAL PRIMARY KEY,
 *   game_name TEXT UNIQUE NOT NULL,
 *   bgg_id INTEGER,
 *   name TEXT,
 *   year TEXT,
 *   min_players TEXT,
 *   max_players TEXT,
 *   playing_time TEXT,
 *   min_play_time TEXT,
 *   max_play_time TEXT,
 *   rating TEXT,
 *   rank TEXT,
 *   thumbnail TEXT,
 *   -- Skill weights (0-10 scale) for player skill hexagon calculation
 *   skill_planning INTEGER DEFAULT 5,
 *   skill_resourcing INTEGER DEFAULT 5,
 *   skill_negotiation INTEGER DEFAULT 0,
 *   skill_social INTEGER DEFAULT 5,
 *   skill_memory INTEGER DEFAULT 3,
 *   skill_luck INTEGER DEFAULT 5,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- To add skill columns to existing table:
 * -- ALTER TABLE bgg_cache ADD COLUMN skill_planning INTEGER DEFAULT 5;
 * -- ALTER TABLE bgg_cache ADD COLUMN skill_resourcing INTEGER DEFAULT 5;
 * -- ALTER TABLE bgg_cache ADD COLUMN skill_negotiation INTEGER DEFAULT 0;
 * -- ALTER TABLE bgg_cache ADD COLUMN skill_social INTEGER DEFAULT 5;
 * -- ALTER TABLE bgg_cache ADD COLUMN skill_memory INTEGER DEFAULT 3;
 * -- ALTER TABLE bgg_cache ADD COLUMN skill_luck INTEGER DEFAULT 5;
 * 
 * -- Enable Row Level Security
 * ALTER TABLE bgg_cache ENABLE ROW LEVEL SECURITY;
 * 
 * -- Allow public read access
 * CREATE POLICY "Allow public read" ON bgg_cache FOR SELECT USING (true);
 * 
 * -- Allow public insert/update (or restrict to authenticated users if needed)
 * CREATE POLICY "Allow public insert" ON bgg_cache FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Allow public update" ON bgg_cache FOR UPDATE USING (true);
 */

// Skill attribute names and labels
const SKILL_ATTRIBUTES = [
    { key: 'planning', label: 'Planning', abbrev: 'P', description: 'Strategic thinking, long-term planning' },
    { key: 'resourcing', label: 'Resourcing', abbrev: 'R', description: 'Hand management, short-term optimization' },
    { key: 'negotiation', label: 'Negotiation', abbrev: 'N', description: 'Trading, deal-making, diplomacy' },
    { key: 'social', label: 'Social Awareness', abbrev: 'S', description: 'Reading opponents, bluffing' },
    { key: 'memory', label: 'Memory', abbrev: 'M', description: 'Card counting, pattern recognition' },
    { key: 'luck', label: 'Luck', abbrev: 'L', description: 'Dice rolling, card draws' }
];

/**
 * Fetch all BGG cache data from Supabase
 */
async function fetchBGGCacheFromSupabase() {
    if (!window.db) {
        console.error('Supabase not initialized');
        return {};
    }
    
    try {
        const { data, error } = await window.db
            .from('bgg_cache')
            .select('*');
        
        if (error) {
            console.error('Error fetching BGG cache:', error);
            return {};
        }
        
        // Convert to lookup object keyed by game_name
        const cache = {};
        if (data) {
            data.forEach(row => {
                cache[row.game_name.toLowerCase()] = {
                    id: row.bgg_id,
                    name: row.name,
                    year: row.year,
                    minPlayers: row.min_players,
                    maxPlayers: row.max_players,
                    playingTime: row.playing_time,
                    minPlayTime: row.min_play_time,
                    maxPlayTime: row.max_play_time,
                    rating: row.rating,
                    rank: row.rank,
                    thumbnail: row.thumbnail,
                    bggLink: row.bgg_id ? `https://boardgamegeek.com/boardgame/${row.bgg_id}` : null,
                    // Skill weights (default to moderate values if not set)
                    skills: {
                        planning: row.skill_planning ?? 5,
                        resourcing: row.skill_resourcing ?? row.skill_management ?? 5,
                        negotiation: row.skill_negotiation ?? 0,
                        social: row.skill_social ?? 5,
                        memory: row.skill_memory ?? 3,
                        luck: row.skill_luck ?? 5
                    }
                };
            });
        }
        
        console.log(`Loaded ${Object.keys(cache).length} games from BGG cache`);
        return cache;
    } catch (e) {
        console.error('Error fetching BGG cache:', e);
        return {};
    }
}

/**
 * Save a game's BGG data to Supabase cache
 */
async function saveBGGToSupabase(gameName, bggData) {
    if (!window.db) return false;
    
    const gameNameLower = gameName.toLowerCase().trim();
    
    try {
        const updateData = {
            game_name: gameNameLower,
            bgg_id: bggData.id || null,
            name: bggData.name || gameName,
            year: bggData.year || null,
            min_players: bggData.minPlayers || null,
            max_players: bggData.maxPlayers || null,
            playing_time: bggData.playingTime || null,
            min_play_time: bggData.minPlayTime || null,
            max_play_time: bggData.maxPlayTime || null,
            rating: bggData.rating || null,
            rank: bggData.rank || null,
            thumbnail: bggData.thumbnail || null
        };
        
        // Include skill weights if provided
        if (bggData.skills) {
            updateData.skill_planning = bggData.skills.planning ?? 5;
            updateData.skill_resourcing = bggData.skills.resourcing ?? 5;
            updateData.skill_negotiation = bggData.skills.negotiation ?? 0;
            updateData.skill_social = bggData.skills.social ?? 5;
            updateData.skill_memory = bggData.skills.memory ?? 3;
            updateData.skill_luck = bggData.skills.luck ?? 5;
        }
        
        const { error } = await window.db
            .from('bgg_cache')
            .upsert(updateData, { onConflict: 'game_name' });
        
        if (error) {
            console.error('Error saving BGG cache:', error);
            return false;
        }
        
        console.log(`Saved BGG data for "${gameName}" to cache`);
        return true;
    } catch (e) {
        console.error('Error saving BGG cache:', e);
        return false;
    }
}

/**
 * Update only the skill weights for a game
 */
async function updateGameSkills(gameName, skills) {
    if (!window.db) return false;
    
    const gameNameLower = gameName.toLowerCase().trim();
    
    try {
        const { error } = await window.db
            .from('bgg_cache')
            .update({
                skill_planning: skills.planning ?? 5,
                skill_resourcing: skills.resourcing ?? 5,
                skill_negotiation: skills.negotiation ?? 0,
                skill_social: skills.social ?? 5,
                skill_memory: skills.memory ?? 3,
                skill_luck: skills.luck ?? 5
            })
            .eq('game_name', gameNameLower);
        
        if (error) {
            console.error('Error updating game skills:', error);
            return false;
        }
        
        console.log(`Updated skills for "${gameName}"`);
        return true;
    } catch (e) {
        console.error('Error updating game skills:', e);
        return false;
    }
}

/**
 * Placeholder for session cache (not used with Supabase approach)
 */
function clearBGGSessionCache() {
    // No-op - cache is in Supabase now
}

/**
 * Fetch BGG data for multiple games from Supabase cache
 */
async function getBGGDataForGames(gameNames, onProgress) {
    // Fetch all cached data from Supabase
    const cache = await fetchBGGCacheFromSupabase();
    
    const results = {};
    let processed = 0;
    
    for (const name of gameNames) {
        const cacheKey = name.toLowerCase().trim();
        results[cacheKey] = cache[cacheKey] || null;
        processed++;
        
        if (onProgress) {
            onProgress(processed, gameNames.length, name);
        }
    }
    
    return results;
}

/**
 * Render games library with BGG data
 */
function renderGamesLibrary(gameTypes, bggData, localStats) {
    const container = document.getElementById('games-library-grid');
    const loadingEl = document.getElementById('bgg-loading');
    
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    if (!gameTypes || gameTypes.length === 0) {
        container.innerHTML = '<p class="no-bgg-data">No games logged yet. Start logging games to see them here!</p>';
        return;
    }
    
    // Sort games by play count (most played first)
    const sortedGames = [...gameTypes].sort((a, b) => {
        const countA = localStats[a]?.timesPlayed || 0;
        const countB = localStats[b]?.timesPlayed || 0;
        return countB - countA;
    });
    
    container.innerHTML = sortedGames.map(gameName => {
        const bggKey = gameName.toLowerCase().trim();
        const bgg = bggData[bggKey];
        const stats = localStats[gameName] || { timesPlayed: 0, wins: {}, lastPlayed: 'N/A' };
        
        // Calculate who wins most at this game (honor ties)
        const winsEntries = Object.entries(stats.wins || {}).sort((a, b) => b[1] - a[1]);
        const maxWins = winsEntries.length > 0 ? winsEntries[0][1] : 0;
        const topWinners = winsEntries.filter(entry => entry[1] === maxWins);
        
        if (bgg) {
            // We have BGG data
            const playerRange = bgg.minPlayers === bgg.maxPlayers 
                ? bgg.minPlayers 
                : `${bgg.minPlayers}-${bgg.maxPlayers}`;
            
            const playTime = bgg.minPlayTime === bgg.maxPlayTime
                ? `${bgg.playingTime} min`
                : `${bgg.minPlayTime}-${bgg.maxPlayTime} min`;
            
            return `
                <div class="game-library-card" data-game="${gameName}">
                    <div class="game-card-header">
                        ${bgg.thumbnail 
                            ? `<img src="${bgg.thumbnail}" alt="${bgg.name}" class="game-card-thumbnail">`
                            : `<div class="game-card-thumbnail placeholder">🎲</div>`
                        }
                        <div class="game-card-title-section">
                            <div class="game-card-title" title="${bgg.name}">${bgg.name}</div>
                            <div class="game-card-year">${bgg.year || 'Year unknown'}</div>
                            <div class="game-card-rating">
                                <span class="bgg-rating">${bgg.rating}</span>
                                <span class="bgg-rating-label">BGG Rating</span>
                            </div>
                        </div>
                    </div>
                    <div class="game-card-body">
                        <div class="game-card-stats">
                            <div class="game-stat">
                                <div class="game-stat-value">${playerRange}</div>
                                <div class="game-stat-label">Players</div>
                            </div>
                            <div class="game-stat">
                                <div class="game-stat-value">${playTime}</div>
                                <div class="game-stat-label">Play Time</div>
                            </div>
                            <div class="game-stat">
                                <div class="game-stat-value">#${bgg.rank !== 'Not Ranked' ? bgg.rank : 'N/A'}</div>
                                <div class="game-stat-label">BGG Rank</div>
                            </div>
                        </div>
                        <div class="game-card-your-stats">
                            <h4>Your Group's Stats</h4>
                            <div class="your-stats-grid">
                                <div class="your-stat">
                                    <div class="your-stat-value">${stats.timesPlayed}</div>
                                    <div class="your-stat-label">Times Played</div>
                                </div>
                                <div class="your-stat">
                                    <div class="your-stat-value">${topWinners.length > 0 ? topWinners.map(w => w[0]).join(' & ') : 'N/A'}</div>
                                    <div class="your-stat-label">Top Winner${topWinners.length > 1 ? 's' : ''}</div>
                                </div>
                                <div class="your-stat">
                                    <div class="your-stat-value">${topWinners.length > 0 ? topWinners[0][1] : 0}</div>
                                    <div class="your-stat-label">${topWinners.length > 1 ? 'Each' : 'Their'} Wins</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="game-card-actions">
                        <a href="${bgg.bggLink}" target="_blank" class="game-card-link">View on BGG →</a>
                        <button class="game-card-skill-btn" onclick="openSkillModal('${gameName.replace(/'/g, "\\'")}')">Edit Skills</button>
                    </div>
                </div>
            `;
        } else {
            // No BGG data found
            return `
                <div class="game-library-card" data-game="${gameName}">
                    <div class="game-card-header">
                        <div class="game-card-thumbnail placeholder">🎲</div>
                        <div class="game-card-title-section">
                            <div class="game-card-title" title="${gameName}">${gameName}</div>
                            <div class="game-card-year">Not found on BGG</div>
                            <div class="game-card-rating">
                                <span class="bgg-rating">-</span>
                                <span class="bgg-rating-label">No Rating</span>
                            </div>
                        </div>
                    </div>
                    <div class="game-card-body">
                        <div class="game-card-stats">
                            <div class="game-stat">
                                <div class="game-stat-value">-</div>
                                <div class="game-stat-label">Players</div>
                            </div>
                            <div class="game-stat">
                                <div class="game-stat-value">-</div>
                                <div class="game-stat-label">Play Time</div>
                            </div>
                            <div class="game-stat">
                                <div class="game-stat-value">-</div>
                                <div class="game-stat-label">BGG Rank</div>
                            </div>
                        </div>
                        <div class="game-card-your-stats">
                            <h4>Your Group's Stats</h4>
                            <div class="your-stats-grid">
                                <div class="your-stat">
                                    <div class="your-stat-value">${stats.timesPlayed}</div>
                                    <div class="your-stat-label">Times Played</div>
                                </div>
                                <div class="your-stat">
                                    <div class="your-stat-value">${topWinners.length > 0 ? topWinners.map(w => w[0]).join(' & ') : 'N/A'}</div>
                                    <div class="your-stat-label">Top Winner${topWinners.length > 1 ? 's' : ''}</div>
                                </div>
                                <div class="your-stat">
                                    <div class="your-stat-value">${topWinners.length > 0 ? topWinners[0][1] : 0}</div>
                                    <div class="your-stat-label">${topWinners.length > 1 ? 'Each' : 'Their'} Wins</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="game-card-actions">
                        <a href="https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(gameName)}" target="_blank" class="game-card-link">Search BGG →</a>
                        <button class="game-card-skill-btn" onclick="openSkillModal('${gameName.replace(/'/g, "\\'")}')">Edit Skills</button>
                    </div>
                </div>
            `;
        }
    }).join('');
}

/**
 * Calculate skill profiles for ALL players
 * 
 * For each game, your "dominance" = your wins / total wins.
 * You earn skill points = dominance × game's skill weights.
 * Scores are averaged across all games you've won.
 * 
 * @param {Object} playerGameStats - Per-player, per-game stats { player: { game: { wins, played } } }
 * @param {Object} bggData - BGG data cache with skill weights
 * @returns {Object} Map of playerName -> skill profile
 */
function calculateAllPlayerSkills(playerGameStats, bggData) {
    const POINTS_PER_GAME = 30;
    const skillKeys = ['planning', 'resourcing', 'negotiation', 'social', 'memory', 'luck'];
    const players = Object.keys(playerGameStats);
    
    const playerData = {};
    players.forEach(player => {
        playerData[player] = { skillTotals: {}, gamesWithWins: 0 };
        skillKeys.forEach(skill => playerData[player].skillTotals[skill] = 0);
    });
    
    for (const [bggKey, gameData] of Object.entries(bggData)) {
        if (!gameData || !gameData.skills) continue;
        
        const gameSkills = gameData.skills;
        const totalSkillWeight = skillKeys.reduce((sum, skill) => sum + (gameSkills[skill] || 0), 0);
        if (totalSkillWeight === 0) continue;
        
        const playerWinsInGame = {};
        let totalWinsInGame = 0;
        
        players.forEach(player => {
            const gameStats = playerGameStats[player];
            const gameKey = Object.keys(gameStats || {}).find(
                g => g.toLowerCase().trim() === bggKey.toLowerCase().trim()
            );
            if (gameKey && gameStats[gameKey]?.wins > 0) {
                playerWinsInGame[player] = gameStats[gameKey].wins;
                totalWinsInGame += gameStats[gameKey].wins;
            }
        });
        
        if (totalWinsInGame === 0) continue;
        
        for (const [player, wins] of Object.entries(playerWinsInGame)) {
            const dominance = wins / totalWinsInGame;
            playerData[player].gamesWithWins++;
            
            skillKeys.forEach(skill => {
                const maxSkillPoints = (gameSkills[skill] || 0) / totalSkillWeight * POINTS_PER_GAME;
                playerData[player].skillTotals[skill] += maxSkillPoints * dominance;
            });
        }
    }
    
    const playerSkillProfiles = {};
    players.forEach(player => {
        const data = playerData[player];
        if (data.gamesWithWins === 0) {
            playerSkillProfiles[player] = null;
            return;
        }
        
        playerSkillProfiles[player] = {};
        skillKeys.forEach(skill => {
            // Average points per game, as percentage of max possible (30)
            const avgPoints = data.skillTotals[skill] / data.gamesWithWins;
            playerSkillProfiles[player][skill] = Math.round((avgPoints / POINTS_PER_GAME) * 100);
        });
    });
    
    return playerSkillProfiles;
}

/**
 * Get a single player's skill profile from pre-calculated profiles
 * @param {string} playerName - Player name
 * @param {Object} allPlayerSkills - Pre-calculated skill profiles for all players
 * @returns {Object|null} Skill profile or null if not available
 */
function getPlayerSkills(playerName, allPlayerSkills) {
    return allPlayerSkills[playerName] || null;
}

/**
 * Render a radar chart for player skills
 * @param {string} canvasId - ID of the canvas element
 * @param {Object} skills - Skill profile object
 * @param {string} playerName - Player name for label
 */
function renderPlayerSkillChart(canvasId, skills, playerName, globalMax = 100) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !skills) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if any
    if (canvas._chartInstance) {
        canvas._chartInstance.destroy();
    }
    
    // Target data values
    const targetData = SKILL_ATTRIBUTES.map(attr => skills[attr.key] || 0);
    
    // Use global max for consistent scale across all players
    const chartMax = Math.ceil(globalMax * 1.1); // Add 10% padding
    
    // Start with zero data for animation
    const data = {
        labels: SKILL_ATTRIBUTES.map(attr => attr.abbrev),
        datasets: [{
            label: playerName,
            data: [0, 0, 0, 0, 0, 0], // Start from center
            fill: true,
            backgroundColor: 'rgba(139, 115, 85, 0.3)',
            borderColor: 'rgba(139, 115, 85, 1)',
            pointRadius: 0,
            pointHoverRadius: 0,
            borderWidth: 2
        }]
    };
    
    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: chartMax,
                    ticks: { display: false },
                    grid: { color: '#2a2622' },
                    angleLines: { color: '#2a2622' },
                    pointLabels: {
                        color: '#c9c2b5',
                        font: { size: 12, weight: '600' }
                    }
                }
            }
        }
    };
    
    canvas._chartInstance = new Chart(ctx, config);
    
    // Animate to actual values after a brief delay
    setTimeout(() => {
        if (canvas._chartInstance) {
            canvas._chartInstance.data.datasets[0].data = targetData;
            canvas._chartInstance.update();
        }
    }, 50);
}

// Store for BGG data (needed for skill calculations)
let cachedBggData = {};

/**
 * Compare two players using standard tiebreaker chain:
 * 1) Total wins (higher is better)
 * 2) Fewest games played (fewer is better - more efficient)
 * 3) Variety of games won (more unique games won is better)
 * 
 * @param {Object} statsA - Player A stats { wins, gamesPlayed, gamesWon }
 * @param {Object} statsB - Player B stats { wins, gamesPlayed, gamesWon }
 * @returns {number} Negative if A is better, positive if B is better, 0 if truly tied
 */
function comparePlayers(statsA, statsB) {
    // Tiebreaker 1: Total wins (higher is better)
    if (statsA.wins !== statsB.wins) {
        return statsB.wins - statsA.wins;
    }
    
    // Tiebreaker 2: Fewest games played (fewer is better)
    const gamesA = statsA.gamesPlayed || 0;
    const gamesB = statsB.gamesPlayed || 0;
    
    if (gamesA !== gamesB) {
        return gamesA - gamesB; // Lower is better
    }
    
    // Tiebreaker 3: Variety of games won (unique games)
    const varietyA = statsA.gamesWon ? new Set(statsA.gamesWon).size : 0;
    const varietyB = statsB.gamesWon ? new Set(statsB.gamesWon).size : 0;
    
    return varietyB - varietyA;
}

/**
 * Sort players with tiebreakers: total wins, win rate, variety of games won
 * Players who remain tied after all tiebreakers will have the same effective rank
 * 
 * @param {Array} playerEntries - Array of [playerName, stats] entries
 * @param {Array} games - Array of game objects (unused, kept for API compatibility)
 * @returns {Array} Sorted array of [playerName, stats] entries
 */
function sortPlayersWithTiebreakers(playerEntries, games) {
    // Handle edge cases
    if (playerEntries.length <= 1) {
        return playerEntries;
    }
    
    // Sort using the standard tiebreaker chain
    return [...playerEntries].sort((a, b) => {
        return comparePlayers(a[1], b[1]);
    });
}

/**
 * Render players library with detailed stats
 */
function renderPlayersLibrary(playerStats, playerGameStats, bggData) {
    const container = document.getElementById('players-library-grid');
    
    // Store BGG data for skill calculations
    if (bggData) {
        cachedBggData = bggData;
    }
    
    if (!playerStats || Object.keys(playerStats).length === 0) {
        container.innerHTML = '<p class="no-bgg-data">No players found. Start logging games to see player stats!</p>';
        return;
    }
    
    // Get games from global gameData for head-to-head calculations
    const games = window.gameData?.games || [];
    
    // Calculate all player skills at once (they're relative to each other)
    const allPlayerSkills = calculateAllPlayerSkills(playerGameStats || {}, cachedBggData);
    
    // Sort players with tiebreakers: total wins, win rate, variety of games won
    const sortedPlayers = sortPlayersWithTiebreakers(
        Object.entries(playerStats),
        games
    );
    
    // Calculate ranks accounting for ties
    const ranks = [];
    let currentRank = 1;
    
    for (let i = 0; i < sortedPlayers.length; i++) {
        if (i === 0) {
            ranks.push(currentRank);
        } else {
            const prevStats = sortedPlayers[i - 1][1];
            const currStats = sortedPlayers[i][1];
            
            // Check if truly tied using comparePlayers
            const isTied = comparePlayers(prevStats, currStats) === 0;
            
            if (isTied) {
                ranks.push(ranks[i - 1]); // Same rank as previous
            } else {
                currentRank = i + 1; // Rank jumps to position
                ranks.push(currentRank);
            }
        }
    }
    
    container.innerHTML = sortedPlayers.map(([playerName, stats], index) => {
        const winRate = stats.gamesPlayed > 0 
            ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
            : 0;
        
        const rank = ranks[index];
        const rankText = rank === 1 ? '1st Place' : rank === 2 ? '2nd Place' : rank === 3 ? '3rd Place' : `#${rank}`;
        
        // Get favorite games (most wins)
        const gameWins = {};
        if (stats.gamesWon) {
            stats.gamesWon.forEach(game => {
                gameWins[game] = (gameWins[game] || 0) + 1;
            });
        }
        const topGames = Object.entries(gameWins)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        // Get games played count
        const gamesPlayedSet = new Set(stats.gamesPlayed_list || []);
        const uniqueGamesPlayed = gamesPlayedSet.size;
        
        // Create unique canvas ID for this player
        const canvasId = `skill-chart-${playerName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // Get pre-calculated player skills (relative to other players)
        const playerSkills = getPlayerSkills(playerName, allPlayerSkills);
        const hasSkills = playerSkills !== null;
        
        return `
            <div class="player-library-card" data-player="${playerName}">
                <div class="player-card-header">
                    <div class="player-avatar">${playerName.charAt(0)}</div>
                    <div>
                        <div class="player-card-name">${playerName}</div>
                        <div class="player-card-rank">${rankText}</div>
                    </div>
                </div>
                <div class="player-card-stats">
                    <div class="player-stat-box">
                        <div class="player-stat-value">${stats.wins}</div>
                        <div class="player-stat-label">Total Wins</div>
                    </div>
                    <div class="player-stat-box">
                        <div class="player-stat-value">${winRate}%</div>
                        <div class="player-stat-label">Win Rate</div>
                    </div>
                    <div class="player-stat-box">
                        <div class="player-stat-value">${stats.gamesPlayed}</div>
                        <div class="player-stat-label">Games Played</div>
                    </div>
                    <div class="player-stat-box">
                        <div class="player-stat-value">${stats.longestStreak || 0}</div>
                        <div class="player-stat-label">Best Streak</div>
                    </div>
                </div>
                ${hasSkills ? `
                    <div class="player-skill-hexagon">
                        <h4>Skill Profile</h4>
                        <div class="skill-chart-container">
                            <canvas id="${canvasId}" width="200" height="200"></canvas>
                        </div>
                    </div>
                ` : `
                    <div class="player-skill-hexagon no-skills">
                        <h4>Skill Profile</h4>
                        <p class="no-skills-text">Set game skill weights in the Games tab to see player skill profiles</p>
                    </div>
                `}
                ${topGames.length > 0 ? `
                    <div class="player-favorite-games">
                        <h4>Top Games Won</h4>
                        <div class="favorite-game-list">
                            ${topGames.map(([game, wins]) => `
                                <div class="favorite-game-item">
                                    <span class="favorite-game-name">${game}</span>
                                    <span class="favorite-game-wins">${wins} wins</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Calculate global max skill value across all players for consistent chart scale
    let globalMaxSkill = 1;
    for (const [playerName, skills] of Object.entries(allPlayerSkills)) {
        if (skills) {
            const playerMax = Math.max(...Object.values(skills));
            if (playerMax > globalMaxSkill) globalMaxSkill = playerMax;
        }
    }
    
    // Render skill charts after DOM is updated
    setTimeout(() => {
        sortedPlayers.forEach(([playerName, stats]) => {
            const canvasId = `skill-chart-${playerName.replace(/[^a-zA-Z0-9]/g, '-')}`;
            const playerSkills = getPlayerSkills(playerName, allPlayerSkills);
            if (playerSkills) {
                renderPlayerSkillChart(canvasId, playerSkills, playerName, globalMaxSkill);
            }
        });
    }, 100);
}

/**
 * Calculate local game stats from game data
 */
function calculateLocalGameStats(games) {
    const stats = {};
    
    games.forEach(game => {
        const gameName = game.gameName;
        if (!gameName) return;
        
        if (!stats[gameName]) {
            stats[gameName] = {
                timesPlayed: 0,
                wins: {},
                lastPlayed: null
            };
        }
        
        stats[gameName].timesPlayed++;
        
        // Support multiple winners
        const winners = game.winners || (game.winner ? [game.winner] : []);
        winners.forEach(winner => {
            if (winner) {
                stats[gameName].wins[winner] = (stats[gameName].wins[winner] || 0) + 1;
            }
        });
        
        if (game.date) {
            stats[gameName].lastPlayed = game.date;
        }
    });
    
    return stats;
}

/**
 * Initialize the library section
 */
async function initLibrary(gameTypes, games, playerStats, playerGameStats) {
    // Set up library tab switching
    const libraryTabs = document.querySelectorAll('.library-tab');
    libraryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update tab states
            libraryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            const targetId = tab.dataset.tab;
            document.querySelectorAll('.library-content').forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Calculate local stats
    const localGameStats = calculateLocalGameStats(games);
    
    // Fetch BGG data for all games
    const loadingEl = document.getElementById('bgg-loading');
    
    if (gameTypes.length === 0) {
        if (loadingEl) loadingEl.style.display = 'none';
        renderGamesLibrary([], {}, {});
        renderPlayersLibrary(playerStats, playerGameStats, {});
        return;
    }
    
    // Show loading state
    if (loadingEl) {
        loadingEl.style.display = 'flex';
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading game data...</p>
        `;
    }
    
    // Fetch BGG data from Supabase cache
    const bggData = await getBGGDataForGames(gameTypes);
    
    // Store for skill calculations
    cachedBggData = bggData;
    
    // Render games library
    renderGamesLibrary(gameTypes, bggData, localGameStats);
    
    // Render players with BGG data for skill calculations
    renderPlayersLibrary(playerStats, playerGameStats, bggData);
}

// Store current game being edited
let currentEditingGame = null;

/**
 * Open the skill editing modal for a game
 */
function openSkillModal(gameName) {
    const modal = document.getElementById('skill-modal');
    const gameTitle = document.getElementById('skill-modal-game-title');
    
    if (!modal) {
        console.error('Skill modal not found in DOM');
        return;
    }
    
    currentEditingGame = gameName;
    gameTitle.textContent = gameName;
    
    // Get current skills from cache
    const bggKey = gameName.toLowerCase().trim();
    const gameData = cachedBggData[bggKey];
    
    const defaultSkills = {
        planning: 5,
        resourcing: 5,
        negotiation: 0,
        social: 5,
        memory: 3,
        luck: 5
    };
    
    const currentSkills = gameData?.skills || defaultSkills;
    
    // Set slider values
    SKILL_ATTRIBUTES.forEach(attr => {
        const slider = document.getElementById(`skill-${attr.key}`);
        const valueDisplay = document.getElementById(`skill-${attr.key}-value`);
        if (slider && valueDisplay) {
            slider.value = currentSkills[attr.key] || 0;
            valueDisplay.textContent = slider.value;
        }
    });
    
    // Update preview chart
    updateSkillPreviewChart();
    
    // Show modal
    modal.classList.add('active');
}

/**
 * Close the skill editing modal
 */
function closeSkillModal() {
    const modal = document.getElementById('skill-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentEditingGame = null;
}

/**
 * Update the preview radar chart in the modal
 */
function updateSkillPreviewChart() {
    const canvas = document.getElementById('skill-preview-chart');
    if (!canvas) return;
    
    const skills = {};
    SKILL_ATTRIBUTES.forEach(attr => {
        const slider = document.getElementById(`skill-${attr.key}`);
        if (slider) {
            skills[attr.key] = parseInt(slider.value) * 10; // Convert 0-10 to 0-100
        }
    });
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (canvas._chartInstance) {
        canvas._chartInstance.destroy();
    }
    
    const data = {
        labels: SKILL_ATTRIBUTES.map(attr => attr.abbrev),
        datasets: [{
            label: 'Skills',
            data: SKILL_ATTRIBUTES.map(attr => skills[attr.key] || 0),
            fill: true,
            backgroundColor: 'rgba(139, 115, 85, 0.3)',
            borderColor: 'rgba(139, 115, 85, 1)',
            pointRadius: 0,
            pointHoverRadius: 0,
            borderWidth: 2
        }]
    };
    
    canvas._chartInstance = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 400,
                easing: 'easeOutQuart'
            },
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { display: false },
                    grid: { color: '#2a2622' },
                    angleLines: { color: '#2a2622' },
                    pointLabels: {
                        color: '#c9c2b5',
                        font: { size: 12, weight: '600' }
                    }
                }
            }
        }
    });
}

/**
 * Save the skill weights for the current game
 */
async function saveGameSkills() {
    if (!currentEditingGame) return;
    
    const skills = {};
    SKILL_ATTRIBUTES.forEach(attr => {
        const slider = document.getElementById(`skill-${attr.key}`);
        if (slider) {
            skills[attr.key] = parseInt(slider.value);
        }
    });
    
    const saveBtn = document.querySelector('.skill-modal-save');
    if (saveBtn) {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
    }
    
    // Check if game exists in cache
    const bggKey = currentEditingGame.toLowerCase().trim();
    const existingData = cachedBggData[bggKey];
    
    let success;
    if (existingData) {
        // Update existing entry
        success = await updateGameSkills(currentEditingGame, skills);
    } else {
        // Create new entry with just skills
        success = await saveBGGToSupabase(currentEditingGame, {
            name: currentEditingGame,
            skills: skills
        });
    }
    
    if (success) {
        // Update local cache
        if (!cachedBggData[bggKey]) {
            cachedBggData[bggKey] = { name: currentEditingGame };
        }
        cachedBggData[bggKey].skills = skills;
        
        // Close modal and show success
        closeSkillModal();
        
        // Trigger a refresh of the library to show updated data
        if (window.refreshLibraryOnly) {
            window.refreshLibraryOnly();
        }
    } else {
        alert('Error saving skills. Please try again.');
    }
    
    if (saveBtn) {
        saveBtn.textContent = 'Save Skills';
        saveBtn.disabled = false;
    }
}

/**
 * Handle slider input change
 */
function handleSkillSliderChange(skillKey) {
    const slider = document.getElementById(`skill-${skillKey}`);
    const valueDisplay = document.getElementById(`skill-${skillKey}-value`);
    if (slider && valueDisplay) {
        valueDisplay.textContent = slider.value;
    }
    updateSkillPreviewChart();
}

/**
 * Open the skills info popup
 */
function openSkillsInfo() {
    const popup = document.getElementById('skills-info-popup');
    if (popup) {
        popup.classList.add('active');
    }
}

/**
 * Close the skills info popup
 */
function closeSkillsInfo() {
    const popup = document.getElementById('skills-info-popup');
    if (popup) {
        popup.classList.remove('active');
    }
}

// Initialize modal close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('skill-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSkillModal();
            }
        });
    }
    
    const popup = document.getElementById('skills-info-popup');
    if (popup) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeSkillsInfo();
            }
        });
    }
});

// Export functions for use in app.js
window.initLibrary = initLibrary;
window.renderGamesLibrary = renderGamesLibrary;
window.renderPlayersLibrary = renderPlayersLibrary;
window.clearBGGSessionCache = clearBGGSessionCache;
window.saveBGGToSupabase = saveBGGToSupabase;
window.openSkillModal = openSkillModal;
window.closeSkillModal = closeSkillModal;
window.saveGameSkills = saveGameSkills;
window.handleSkillSliderChange = handleSkillSliderChange;
window.updateGameSkills = updateGameSkills;
window.sortPlayersWithTiebreakers = sortPlayersWithTiebreakers;
window.comparePlayers = comparePlayers;
window.openSkillsInfo = openSkillsInfo;
window.closeSkillsInfo = closeSkillsInfo;
