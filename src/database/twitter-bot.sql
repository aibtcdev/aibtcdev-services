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
);

-- Define indexes for authors
CREATE INDEX idx_authors_author_id ON x_bot_authors(author_id);
CREATE INDEX idx_authors_username ON x_bot_authors(username);

-- Trigger for x_bot_authors
CREATE TRIGGER update_authors_timestamp
AFTER UPDATE ON x_bot_authors BEGIN
  UPDATE x_bot_authors
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- conversation in API
CREATE TABLE x_bot_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Define indexes for threads
CREATE INDEX idx_threads_created_at ON x_bot_threads(created_at);

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
);

-- Define indexes for tweets
CREATE INDEX idx_tweets_author_id ON x_bot_tweets(author_id);
CREATE INDEX idx_tweets_thread_id ON x_bot_tweets(thread_id);
CREATE INDEX idx_tweets_tweet_id ON x_bot_tweets(tweet_id);
CREATE INDEX idx_tweets_parent_tweet_id ON x_bot_tweets(parent_tweet_id);
CREATE INDEX idx_tweets_is_bot_response ON x_bot_tweets(is_bot_response);
CREATE INDEX idx_tweets_created_at ON x_bot_tweets(created_at);

-- Trigger for x_bot_tweets
CREATE TRIGGER update_tweets_timestamp
AFTER UPDATE ON x_bot_tweets BEGIN
  UPDATE x_bot_tweets
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TABLE x_bot_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tweet_id TEXT NOT NULL,
  tweet_status TEXT DEFAULT 'sent',
  -- sent, pending, failed
  log_message TEXT,
  -- pass info, error, etc
  FOREIGN KEY (tweet_id) REFERENCES x_bot_tweets(tweet_id) ON DELETE CASCADE
);

-- Define indexes for logs
CREATE INDEX idx_logs_tweet_id ON x_bot_logs(tweet_id);
CREATE INDEX idx_logs_tweet_status ON x_bot_logs(tweet_status);
CREATE INDEX idx_logs_created_at ON x_bot_logs(created_at);
