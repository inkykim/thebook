# 📖 The Book

**Phi Delts Board Game Tracker 2026**

A beautiful GitHub Pages site for tracking board game wins, displaying statistics, and awarding fun achievements to your game night crew.

🔗 **Live Site:** [https://YOUR_USERNAME.github.io/thebook](https://YOUR_USERNAME.github.io/thebook)

---

## Features

### 🏆 Awards System

| Award | Description | How It's Calculated |
|-------|-------------|---------------------|
| **The Dominator** 👑 | Most total wins | `COUNT(wins)` across all games |
| **The Collector** 🎯 | Won most different game types | `COUNT(DISTINCT games won)` |
| **The Consistent** 📈 | Highest win rate (min 5 games) | `wins / games_played` where games ≥ 5 |
| **The Socialite** 🎉 | Played the most games | `COUNT(games_played)` |
| **The Specialist** 🔬 | Best win rate in single game (min 3 plays) | `MAX(wins/played)` per game type |
| **The Streak King** 🔥 | Longest winning streak ever | Track consecutive wins |
| **The Underdog** 💪 | Most wins in 4+ player games | Wins where `player_count >= 4` |
| **The Variety Show** 🎲 | Played most different games | `COUNT(DISTINCT games_played)` |
| **The Hot Hand** ✨ | Best recent performance | Win rate in last 10 games played |
| **The Iron Throne** ⚔️ | Longest active winning streak | Current consecutive wins |
| **The Comeback Kid** 🔄 | Most wins after a loss | Count win-after-loss occurrences |
| **The Nemesis** 😈 | Best head-to-head record | Win rate in 2-player matchups |

### 📊 Visualizations

- **Wins by Player** - Bar chart of total wins
- **Win Rate** - Bar chart showing win percentage (min 3 games)
- **Games Distribution** - Doughnut chart of participation
- **Popular Games** - Horizontal bar chart of most played games
- **Wins Over Time** - Line chart tracking cumulative wins

### 📋 Leaderboard & History

- Full leaderboard with rank, wins, games played, win rate, and current streak
- Recent game history showing the last 10 games played

---

## Setup

### 1. Create Your Google Sheet

Create a Google Sheet with these columns:

| Column | Required | Description |
|--------|----------|-------------|
| `date` | Optional | Date of the game (any format) |
| `game` | Yes | Name of the board game |
| `winner` | Yes | Name of the winner |
| `players` | Optional | Comma-separated list of all players |
| `notes` | Optional | Any notes about the game |

**Example:**

| date | game | winner | players | notes |
|------|------|--------|---------|-------|
| 2026-01-15 | Catan | Alex | Alex, Jordan, Sam, Taylor | Epic longest road battle |
| 2026-01-15 | Codenames | Jordan | Alex, Jordan, Sam, Taylor | Team game |
| 2026-01-16 | Ticket to Ride | Sam | Sam, Jordan | 2 player duel |

### 2. Publish Your Sheet

1. Open your Google Sheet
2. Go to **File → Share → Publish to web**
3. Select the sheet tab with your data
4. Choose **Comma-separated values (.csv)** format
5. Click **Publish**
6. Copy the URL

### 3. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to **Pages** section
3. Under "Source", select **Deploy from a branch**
4. Choose `main` branch and `/ (root)` folder
5. Click **Save**

### 4. Use the Site

1. Visit your GitHub Pages URL
2. Paste your Google Sheet CSV URL
3. Click **Load Data**
4. Watch the magic happen! ✨

---

## Data Format Tips

- **Player names** should be consistent (case-sensitive)
- **Date format** can be anything parseable (YYYY-MM-DD recommended)
- **Players column** accepts comma or semicolon separators
- If you only have `winner`, that's fine - they'll be counted as the only player

---

## Customization

### Adding New Awards

Edit `awards.js` and add a new object to the `AWARDS` array:

```javascript
{
    id: 'your-award-id',
    name: 'Award Name',
    icon: '🏅',
    description: 'What this award means',
    calculate: (data) => {
        // data contains: games, players, playerStats, playerGameStats
        // Return: { winner: 'PlayerName', stat: 'Display stat' }
        return { winner: 'PlayerName', stat: '10 things' };
    }
}
```

### Styling

All styles are in `styles.css` with CSS variables for easy theming:

```css
:root {
    --primary: #6366f1;      /* Main accent color */
    --background: #0f172a;   /* Page background */
    --surface: #1e293b;      /* Card backgrounds */
    --text: #f1f5f9;         /* Primary text */
    /* ... more variables */
}
```

---

## Tech Stack

- **Vanilla JavaScript** - No frameworks, fast and simple
- **Chart.js** - Beautiful, responsive charts
- **Google Sheets** - Easy data management
- **GitHub Pages** - Free hosting

---

## License

MIT License - feel free to fork and customize for your own game nights!
