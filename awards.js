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
            let winners = [];
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.wins > maxWins) {
                    maxWins = stats.wins;
                    winners = [player];
                } else if (stats.wins === maxWins && maxWins > 0) {
                    winners.push(player);
                }
            }
            
            return { winner: winners.join(' & ') || null, stat: `${maxWins} wins` };
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
            let winners = [];
            
            for (const [player, stats] of Object.entries(playerStats)) {
                const uniqueWins = new Set(stats.gamesWon).size;
                if (uniqueWins > maxTypes) {
                    maxTypes = uniqueWins;
                    winners = [player];
                } else if (uniqueWins === maxTypes && maxTypes > 0) {
                    winners.push(player);
                }
            }
            
            return { winner: winners.join(' & ') || null, stat: `${maxTypes} different games` };
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
            let winners = [];
            const minGames = 5;
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.gamesPlayed >= minGames) {
                    const rate = stats.wins / stats.gamesPlayed;
                    if (rate > maxRate) {
                        maxRate = rate;
                        winners = [player];
                    } else if (rate === maxRate && maxRate > 0) {
                        winners.push(player);
                    }
                }
            }
            
            return { 
                winner: winners.join(' & ') || null, 
                stat: winners.length > 0 ? `${(maxRate * 100).toFixed(1)}% win rate` : 'N/A'
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
            let winners = [];
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.gamesPlayed > maxGames) {
                    maxGames = stats.gamesPlayed;
                    winners = [player];
                } else if (stats.gamesPlayed === maxGames && maxGames > 0) {
                    winners.push(player);
                }
            }
            
            return { winner: winners.join(' & ') || null, stat: `${maxGames} games played` };
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
            let winners = [];
            let bestGames = [];
            const minPlays = 3;
            
            for (const [player, gameStats] of Object.entries(playerGameStats)) {
                for (const [game, stats] of Object.entries(gameStats)) {
                    if (stats.played >= minPlays) {
                        const rate = stats.wins / stats.played;
                        if (rate > maxRate) {
                            maxRate = rate;
                            winners = [player];
                            bestGames = [game];
                        } else if (rate === maxRate && maxRate > 0) {
                            winners.push(player);
                            bestGames.push(game);
                        }
                    }
                }
            }
            
            // Create display string showing each winner with their game
            const statDisplay = winners.length > 0 
                ? `${(maxRate * 100).toFixed(0)}% in ${[...new Set(bestGames)].join('/')}`
                : 'N/A';
            
            return { 
                winner: [...new Set(winners)].join(' & ') || null, 
                stat: statDisplay
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
            let winners = [];
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.longestStreak > maxStreak) {
                    maxStreak = stats.longestStreak;
                    winners = [player];
                } else if (stats.longestStreak === maxStreak && maxStreak > 0) {
                    winners.push(player);
                }
            }
            
            return { winner: winners.join(' & ') || null, stat: `${maxStreak} wins in a row` };
        }
    },
    {
        id: 'streakbreaker',
        name: 'The Heartbreaker',
        icon: '💔',
        description: 'Most wins that ended another player\'s streak (2+ wins)',
        calculate: (data) => {
            const { games, players } = data;
            const streakBreaks = {};
            
            // Track each player's current streak as we iterate through games
            const currentStreaks = {};
            players.forEach(p => currentStreaks[p] = 0);
            
            games.forEach(game => {
                if (!game.winner || !game.players) return;
                
                // Check if this win broke someone's streak (2+ wins)
                game.players.forEach(player => {
                    if (player !== game.winner && currentStreaks[player] >= 2) {
                        // This winner broke someone's streak!
                        streakBreaks[game.winner] = (streakBreaks[game.winner] || 0) + 1;
                    }
                });
                
                // Update streaks: winner gets +1, all other participants reset to 0
                game.players.forEach(player => {
                    if (player === game.winner) {
                        currentStreaks[player] = (currentStreaks[player] || 0) + 1;
                    } else {
                        currentStreaks[player] = 0;
                    }
                });
            });
            
            let maxBreaks = 0;
            let winners = [];
            
            for (const [player, breaks] of Object.entries(streakBreaks)) {
                if (breaks > maxBreaks) {
                    maxBreaks = breaks;
                    winners = [player];
                } else if (breaks === maxBreaks && maxBreaks > 0) {
                    winners.push(player);
                }
            }
            
            return { winner: winners.join(' & ') || null, stat: winners.length > 0 ? `${maxBreaks} streaks ended` : 'N/A' };
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
            let winners = [];
            
            for (const [player, stats] of Object.entries(playerStats)) {
                const uniqueGames = new Set(stats.gamesPlayed_list).size;
                if (uniqueGames > maxTypes) {
                    maxTypes = uniqueGames;
                    winners = [player];
                } else if (uniqueGames === maxTypes && maxTypes > 0) {
                    winners.push(player);
                }
            }
            
            return { winner: winners.join(' & ') || null, stat: `${maxTypes} different games` };
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
            let winners = [];
            
            for (const [player, stats] of Object.entries(recentStats)) {
                if (stats.rate > maxRate) {
                    maxRate = stats.rate;
                    winners = [player];
                } else if (stats.rate === maxRate && maxRate > 0) {
                    winners.push(player);
                }
            }
            
            return { 
                winner: winners.join(' & ') || null, 
                stat: winners.length > 0 ? `${(maxRate * 100).toFixed(0)}% recently` : 'N/A'
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
            let winners = [];
            
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.currentStreak > maxStreak) {
                    maxStreak = stats.currentStreak;
                    winners = [player];
                } else if (stats.currentStreak === maxStreak && maxStreak > 0) {
                    winners.push(player);
                }
            }
            
            return { 
                winner: winners.join(' & ') || null, 
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
            let winners = [];
            
            for (const [player, comebacks] of Object.entries(comebackWins)) {
                if (comebacks > maxComebacks) {
                    maxComebacks = comebacks;
                    winners = [player];
                } else if (comebacks === maxComebacks && maxComebacks > 0) {
                    winners.push(player);
                }
            }
            
            return { winner: winners.join(' & ') || null, stat: winners.length > 0 ? `${maxComebacks} comebacks` : 'N/A' };
        }
    },
    {
        id: 'giantslayer',
        name: 'The Giant Slayer',
        icon: '🗡️',
        description: 'Most wins in games where the overall leader played',
        calculate: (data) => {
            const { games, playerStats } = data;
            
            // First, find the overall leader (most wins)
            let maxWins = 0;
            let overallLeader = null;
            for (const [player, stats] of Object.entries(playerStats)) {
                if (stats.wins > maxWins) {
                    maxWins = stats.wins;
                    overallLeader = player;
                }
            }
            
            if (!overallLeader) {
                return { winner: null, stat: 'N/A' };
            }
            
            // Count wins against the leader (excluding the leader themselves)
            const slayerWins = {};
            games.forEach(game => {
                if (game.players && game.players.includes(overallLeader) && game.winner && game.winner !== overallLeader) {
                    slayerWins[game.winner] = (slayerWins[game.winner] || 0) + 1;
                }
            });
            
            let maxSlays = 0;
            let winners = [];
            
            for (const [player, wins] of Object.entries(slayerWins)) {
                if (wins > maxSlays) {
                    maxSlays = wins;
                    winners = [player];
                } else if (wins === maxSlays && maxSlays > 0) {
                    winners.push(player);
                }
            }
            
            return { 
                winner: winners.join(' & ') || null, 
                stat: winners.length > 0 ? `${maxSlays} wins vs ${overallLeader}` : 'N/A'
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
