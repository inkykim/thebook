# The Book

A board game tracker for your group. Track wins, view stats, and see who really dominates game night.

## Fork for Your Group

1. **Fork this repo** and clone it

2. **Create a free [Supabase](https://supabase.com) project** and run this SQL:

```sql
CREATE TABLE games (
    id BIGSERIAL PRIMARY KEY,
    date TEXT,
    game TEXT NOT NULL,
    winner TEXT NOT NULL,
    players TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON games
    FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE games;
```

3. **Edit `config.js`** with your Supabase URL and anon key (from Settings → API)

4. **Deploy to GitHub Pages** (Settings → Pages → Deploy from `main`)

That's it. Start logging games.

## License

MIT
