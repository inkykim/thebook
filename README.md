# 📖 The Book

**Phi Delts Board Game Tracker 2026**

A beautiful site for tracking board game wins, displaying statistics, and awarding fun achievements to your game night crew. Data syncs in real-time across all devices via Supabase.

---

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
3. Choose a name and set a database password
4. Wait for the project to be created (~2 minutes)

### 2. Create the Games Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create the games table
CREATE TABLE games (
    id BIGSERIAL PRIMARY KEY,
    date TEXT,
    game TEXT NOT NULL,
    winner TEXT NOT NULL,
    players TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for a trusted friend group)
CREATE POLICY "Allow all operations" ON games
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE games;
```

### 3. Get Your API Keys

1. In Supabase dashboard, go to **Settings → API**
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)

### 4. Configure the App

Edit `config.js` with your credentials:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 5. Deploy to GitHub Pages

1. Commit and push your changes to GitHub
2. Go to **Settings → Pages** in your repository
3. Set source to **Deploy from branch** → `main` → `/ (root)`
4. Your site will be live at `https://YOUR_USERNAME.github.io/thebook`

---

## Features

### 🎲 Log Games
- Click **"+ Log Game"** to record a new game
- Autocomplete suggests games and players from history
- Data syncs instantly to all devices

### ✏️ Edit History
- Click **"Edit"** in the Game Log section
- Modify any game's date, name, winner, or players
- Delete games you want to remove

### 🔄 Real-time Sync
- All changes sync automatically across devices
- No need to refresh - updates appear instantly

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

## Importing Existing Data

You can import existing game data via the Supabase dashboard:

1. Go to **Table Editor → games**
2. Click **"Insert"** → **"Import data from CSV"**

CSV format:
```
date,game,winner,players
1/8/2026,catan,lars,stephen; phs; lars; surya
1/9/2026,catan,lars,phs; surya; stephen; lars
```

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
        return { winner: 'PlayerName', stat: '10 things' };
    }
}
```

### Styling

Edit `styles.css` - uses CSS variables for theming:

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
- Supabase (PostgreSQL + Realtime)
- GitHub Pages

---

## License

MIT
