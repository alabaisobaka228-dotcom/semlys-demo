CREATE TABLE IF NOT EXISTS telegram_profiles (
  telegram_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  username TEXT,
  last_seen INTEGER NOT NULL
);
