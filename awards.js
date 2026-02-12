/**
 * Board Game Awards System
 * Each award has an id, name, icon, description, and calculate function
 * The calculate function receives the processed game data and returns { winner, stat }
 */

const AWARDS = [
    {
        id: 'dominator',
        name: 'The Dominator',
        icon: '♕',
        iconPath: 'icons/overlord-helm.svg',
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
        name: 'The Usurper',
        icon: '◆',
        iconPath: 'icons/goblin-head.svg',
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
        name: 'The Marksman',
        icon: '↑',
        iconPath: 'icons/woman-elf-face.svg',
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
        id: 'specialist',
        name: 'The Specialist',
        icon: '⚗',
        iconPath: 'icons/wizard-face.svg',
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
        name: 'The Warden',
        icon: '☼',
        iconPath: 'icons/dwarf-face.svg',
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
        id: 'hothand',
        name: 'The Kindled',
        icon: '✦',
        iconPath: 'icons/dragon-head.svg',
        description: 'Best win rate in the last 10 games played',
        calculate: (data) => {
            const { games, players } = data;
            const recentGames = games.slice(-20);
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
        name: 'The Zealot',
        icon: '⚔',
        iconPath: 'icons/crowned-skull.svg',
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
        id: 'loser',
        name: 'The Loser',
        icon: '☹',
        iconPath: 'icons/troll.svg',
        description: 'Longest losing streak',
        calculate: (data) => {
            const { games, players } = data;
            const losingStreaks = {};
            
            players.forEach(player => {
                let currentStreak = 0;
                let maxStreak = 0;
                
                games.forEach(game => {
                    if (game.players && game.players.includes(player)) {
                        if (game.winner !== player) {
                            currentStreak++;
                            if (currentStreak > maxStreak) {
                                maxStreak = currentStreak;
                            }
                        } else {
                            currentStreak = 0;
                        }
                    }
                });
                
                losingStreaks[player] = maxStreak;
            });
            
            let maxLosing = 0;
            let winners = [];
            
            for (const [player, streak] of Object.entries(losingStreaks)) {
                if (streak > maxLosing) {
                    maxLosing = streak;
                    winners = [player];
                } else if (streak === maxLosing && maxLosing > 0) {
                    winners.push(player);
                }
            }
            
            return { 
                winner: winners.join(' & ') || null, 
                stat: maxLosing > 0 ? `${maxLosing} losses in a row` : 'N/A'
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
