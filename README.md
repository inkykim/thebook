# 📖 The Book

**Phi Delts Board Game Tracker 2026**

A beautiful site for tracking board game wins, displaying statistics, and awarding fun achievements to your game night crew.

---

## Features

### 🎲 Log Games
- Click **"+ Log Game"** to record a new game
- Autocomplete suggests games and players from your history
- Games are saved locally in your browser

### ✏️ Edit History
- Click **"Edit"** in the Game Log section
- Modify any game's date, name, winner, or players
- Delete games you want to remove

### 🏆 Awards

| Award | Description |
|-------|-------------|
| **The Dominator** 👑 | Most total wins |
| **The Collector** 🎯 | Won most different game types |
| **The Consistent** 📈 | Highest win rate (min 5 games) |
| **The Socialite** 🎉 | Played the most games |
| **The Specialist** 🔬 | Best win rate in single game (min 3 plays) |
| **The Streak King** 🔥 | Longest winning streak ever |
| **The Underdog** 💪 | Most wins in 4+ player games |
| **The Variety Show** 🎲 | Played most different games |
| **The Hot Hand** ✨ | Best recent performance |
| **The Iron Throne** ⚔️ | Longest active winning streak |
| **The Comeback Kid** 🔄 | Most wins after a loss |
| **The Nemesis** 😈 | Best head-to-head record |

### 📊 Visualizations

- **Wins by Player** - Bar chart of total wins
- **Win Rate** - Bar chart showing win percentage
- **Games Distribution** - Doughnut chart of participation
- **Popular Games** - Most played games
- **Wins Over Time** - Cumulative wins timeline

---

## Setup

### Enable GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **Deploy from branch** → `main` → `/ (root)`
4. Your site will be live at `https://YOUR_USERNAME.github.io/thebook`

---

## Data Storage

All data is stored in your browser's **localStorage**. This means:
- Data persists between sessions
- Each browser/device has its own data
- Clearing browser data will reset the tracker

---

## Customization

### Adding New Awards

Edit `awards.js` and add to the `AWARDS` array:

```javascript
{
    id: 'your-award-id',
    name: 'Award Name',
    icon: '🏅',
    description: 'What this award means',
    calculate: (data) => {
        // data contains: games, players, playerStats, playerGameStats
        return { winner: 'PlayerName', stat: '10 things' };
    }
}
```

### Styling

Edit `styles.css` - uses CSS variables for easy theming:

```css
:root {
    --primary: #6366f1;
    --background: #0f172a;
    --surface: #1e293b;
    --text: #f1f5f9;
}
```

---

## Tech Stack

- Vanilla JavaScript
- Chart.js
- localStorage
- GitHub Pages

---

## License

MIT
