/**
 * Board Game Awards System
 * Each award has an id, name, icon, description, and calculate function
 * The calculate function receives the processed game data and returns { winner, stat }
 */

const AWARDS = [
    {
        id: 'dominator',
        name: 'The Dominator',
        icon: '👑',
        description: 'Most total wins across all games',
        calculate: (data) => {
            const { playerStats } = data;
            let maxWins = 0;
            let winner = null;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.wins > maxWins) {
                    maxWins = stats.wins;
                    winner = player;
                }
            }
            
            return { winner, stat: `${maxWins} wins` };
        }
    },
    {
        id: 'collector',
        name: 'The Collector',
        icon: '🎯',
        description: 'Won the most different types of games',
        calculate: (data) => {
            const { playerStats } = data;
            let maxTypes = 0;
            let winner = null;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                const uniqueWins = new Set(stats.gamesWon).size;
                if (uniqueWins > maxTypes) {
                    maxTypes = uniqueWins;
                    winner = player;
                }
            }
            
            return { winner, stat: `${maxTypes} different games` };
        }
    },
    {
        id: 'consistent',
        name: 'The Consistent',
        icon: '📈',
        description: 'Highest win rate (min 5 games played)',
        calculate: (data) => {
            const { playerStats } = data;
            let maxRate = 0;
            let winner = null;
            const minGames = 5;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.gamesPlayed >= minGames) {
                    const rate = stats.wins / stats.gamesPlayed;
                    if (rate > maxRate) {
                        maxRate = rate;
                        winner = player;
                    }
                }
            }
            
            return { 
                winner, 
                stat: winner ? `${(maxRate * 100).toFixed(1)}% win rate` : 'N/A'
            };
        }
    },
    {
        id: 'socialite',
        name: 'The Socialite',
        icon: '🎉',
        description: 'Played in the most total games',
        calculate: (data) => {
            const { playerStats } = data;
            let maxGames = 0;
            let winner = null;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.gamesPlayed > maxGames) {
                    maxGames = stats.gamesPlayed;
                    winner = player;
                }
            }
            
            return { winner, stat: `${maxGames} games played` };
        }
    },
    {
        id: 'specialist',
        name: 'The Specialist',
        icon: '🔬',
        description: 'Highest win rate in a single game type (min 3 plays)',
        calculate: (data) => {
            const { playerGameStats } = data;
            let maxRate = 0;
            let winner = null;
            let bestGame = null;
            const minPlays = 3;
            
            for (const [player, gameStats] of Object.entries(playerGameStats)) {
                for (const [game, stats] of Object.entries(gameStats)) {
                    if (stats.played >= minPlays) {
                        const rate = stats.wins / stats.played;
                        if (rate > maxRate) {
                            maxRate = rate;
                            winner = player;
                            bestGame = game;
                        }
                    }
                }
            }
            
            return { 
                winner, 
                stat: winner ? `${(maxRate * 100).toFixed(0)}% in ${bestGame}` : 'N/A'
            };
        }
    },
    {
        id: 'streak',
        name: 'The Streak King',
        icon: '🔥',
        description: 'Longest winning streak',
        calculate: (data) => {
            const { playerStats } = data;
            let maxStreak = 0;
            let winner = null;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.longestStreak > maxStreak) {
                    maxStreak = stats.longestStreak;
                    winner = player;
                }
            }
            
            return { winner, stat: `${maxStreak} wins in a row` };
        }
    },
    {
        id: 'underdog',
        name: 'The Underdog',
        icon: '💪',
        description: 'Most wins in games with 4+ players',
        calculate: (data) => {
            const { games, playerStats } = data;
            const bigGameWins = {};
            
            games.forEach(game => {
                if (game.players && game.players.length >= 4 && game.winner) {
                    bigGameWins[game.winner] = (bigGameWins[game.winner] || 0) + 1;
                }
            });
            
            let maxWins = 0;
            let winner = null;
            
            for (const [player, wins] of Object.entries(bigGameWins)) {
                if (wins > maxWins) {
                    maxWins = wins;
                    winner = player;
                }
            }
            
            return { winner, stat: winner ? `${maxWins} big game wins` : 'N/A' };
        }
    },
    {
        id: 'variety',
        name: 'The Variety Show',
        icon: '🎲',
        description: 'Played the most different game types',
        calculate: (data) => {
            const { playerStats } = data;
            let maxTypes = 0;
            let winner = null;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                const uniqueGames = new Set(stats.gamesPlayed_list).size;
                if (uniqueGames > maxTypes) {
                    maxTypes = uniqueGames;
                    winner = player;
                }
            }
            
            return { winner, stat: `${maxTypes} different games` };
        }
    },
    {
        id: 'hothand',
        name: 'The Hot Hand',
        icon: '✨',
        description: 'Best win rate in the last 10 games played',
        calculate: (data) => {
            const { games, players } = data;
            const recentGames = games.slice(-20); // Look at recent games
            const recentStats = {};
            
            players.forEach(player => {
                const playerGames = recentGames.filter(g => 
                    g.players && g.players.includes(player)
                ).slice(-10);
                
                if (playerGames.length >= 3) {
                    const wins = playerGames.filter(g => g.winner === player).length;
                    recentStats[player] = {
                        wins,
                        played: playerGames.length,
                        rate: wins / playerGames.length
                    };
                }
            });
            
            let maxRate = 0;
            let winner = null;
            
            for (const [player, stats] of Object.entries(recentStats)) {
                if (stats.rate > maxRate) {
                    maxRate = stats.rate;
                    winner = player;
                }
            }
            
            return { 
                winner, 
                stat: winner ? `${(maxRate * 100).toFixed(0)}% recently` : 'N/A'
            };
        }
    },
    {
        id: 'ironthrone',
        name: 'The Iron Throne',
        icon: '⚔️',
        description: 'Currently on the longest active winning streak',
        calculate: (data) => {
            const { playerStats } = data;
            let maxStreak = 0;
            let winner = null;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.currentStreak > maxStreak) {
                    maxStreak = stats.currentStreak;
                    winner = player;
                }
            }
            
            return { 
                winner, 
                stat: maxStreak > 0 ? `${maxStreak} game streak` : 'No active streaks'
            };
        }
    },
    {
        id: 'comeback',
        name: 'The Comeback Kid',
        icon: '🔄',
        description: 'Most wins immediately after a loss',
        calculate: (data) => {
            const { games, players } = data;
            const comebackWins = {};
            
            players.forEach(player => {
                comebackWins[player] = 0;
                let lastResult = null;
                
                games.forEach(game => {
                    if (game.players && game.players.includes(player)) {
                        const won = game.winner === player;
                        if (lastResult === false && won) {
                            comebackWins[player]++;
                        }
                        lastResult = won;
                    }
                });
            });
            
            let maxComebacks = 0;
            let winner = null;
            
            for (const [player, comebacks] of Object.entries(comebackWins)) {
                if (comebacks > maxComebacks) {
                    maxComebacks = comebacks;
                    winner = player;
                }
            }
            
            return { winner, stat: winner ? `${maxComebacks} comebacks` : 'N/A' };
        }
    },
    {
        id: 'nemesis',
        name: 'The Nemesis',
        icon: '😈',
        description: 'Best head-to-head record against another player',
        calculate: (data) => {
            const { games, players } = data;
            const headToHead = {};
            
            // Calculate head-to-head for 2-player games
            games.forEach(game => {
                if (game.players && game.players.length === 2 && game.winner) {
                    const [p1, p2] = game.players;
                    const key = `${game.winner} vs ${game.winner === p1 ? p2 : p1}`;
                    headToHead[key] = headToHead[key] || { wins: 0, total: 0, winner: game.winner, loser: game.winner === p1 ? p2 : p1 };
                    headToHead[key].wins++;
                    headToHead[key].total++;
                    
                    // Track losses for opponent
                    const reverseKey = `${game.winner === p1 ? p2 : p1} vs ${game.winner}`;
                    headToHead[reverseKey] = headToHead[reverseKey] || { wins: 0, total: 0, winner: game.winner === p1 ? p2 : p1, loser: game.winner };
                    headToHead[reverseKey].total++;
                }
            });
            
            let bestRecord = 0;
            let winner = null;
            let opponent = null;
            let wins = 0;
            let total = 0;
            
            for (const [key, stats] of Object.entries(headToHead)) {
                if (stats.total >= 3) {
                    const rate = stats.wins / stats.total;
                    if (rate > bestRecord) {
                        bestRecord = rate;
                        winner = stats.winner;
                        opponent = stats.loser;
                        wins = stats.wins;
                        total = stats.total;
                    }
                }
            }
            
            return { 
                winner, 
                stat: winner ? `${wins}-${total - wins} vs ${opponent}` : 'N/A'
            };
        }
    }
];

/**
 * Calculate all awards based on the game data
 * @param {Object} processedData - The processed game data
 * @returns {Array} - Array of award results
 */
function calculateAwards(processedData) {
    return AWARDS.map(award => {
        const result = award.calculate(processedData);
        return {
            ...award,
            winner: result.winner || 'TBD',
            stat: result.stat || 'N/A'
        };
    });
}
