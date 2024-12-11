-- ============================================================================
-- Twitter/X Bot Integration
-- ============================================================================
-- Manages API responses and actions.
-- Separate from user-defined structure.

CREATE TABLE x_bot_authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  author_id TEXT NOT NULL UNIQUE,
  realname TEXT,
  username TEXT
)

-- conversation in API
CREATE TABLE x_bot_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE x_bot_tweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  author_id TEXT NOT NULL,
  thread_id INTEGER,
  parent_tweet_id TEXT,
  tweet_id TEXT NOT NULL UNIQUE,
  tweet_created_at DATETIME,
  tweet_updated_at DATETIME,
  tweet_body TEXT,
  is_bot_response INTEGER DEFAULT 0,
  FOREIGN KEY (author_id) REFERENCES x_bot_authors(author_id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES x_bot_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_tweet_id) REFERENCES x_bot_tweets(tweet_id) ON DELETE CASCADE
)

CREATE TABLE x_bot_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tweet_id TEXT NOT NULL,
  tweet_status TEXT DEFAULT 'sent',
  -- sent, pending, failed
  log_message TEXT,
  -- pass info, error, etc
  FOREIGN KEY (tweet_id) REFERENCES x_bot_tweets(tweet_id) ON DELETE CASCADE
)