-- Ethereum World Database Schema
-- PostgreSQL schema for RSS feed aggregation and content storage

-- Enable UUID extension for potential future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Feed Sources Table
-- Stores RSS feed source configuration and status
CREATE TABLE IF NOT EXISTS feed_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  update_interval INTEGER DEFAULT 120, -- in minutes
  last_fetched TIMESTAMP,
  last_success TIMESTAMP,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts Table
-- Stores aggregated and normalized content from all sources
CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  snippet TEXT,
  url TEXT NOT NULL UNIQUE,
  author VARCHAR(255),
  source VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  pub_date TIMESTAMP NOT NULL,
  image_url TEXT,
  source_id INTEGER REFERENCES feed_sources(id) ON DELETE SET NULL,
  raw_content TEXT, -- Optional: store original HTML content
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_pub_date ON posts(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_source_id ON posts(source_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category_date ON posts(category, pub_date DESC);

CREATE INDEX IF NOT EXISTS idx_sources_category ON feed_sources(category);
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON feed_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_sources_last_fetched ON feed_sources(last_fetched);

-- Feed Fetch History Table (Optional: for monitoring and debugging)
CREATE TABLE IF NOT EXISTS fetch_history (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES feed_sources(id) ON DELETE CASCADE,
  fetch_time TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  items_count INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_fetch_history_source ON fetch_history(source_id, fetch_time DESC);

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON feed_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for recent posts with source information
CREATE OR REPLACE VIEW recent_posts AS
SELECT
  p.id,
  p.title,
  p.snippet,
  p.url,
  p.author,
  p.source,
  p.category,
  p.pub_date,
  p.image_url,
  p.created_at,
  fs.name as source_name,
  fs.priority as source_priority
FROM posts p
LEFT JOIN feed_sources fs ON p.source_id = fs.id
ORDER BY p.pub_date DESC;

-- View for source statistics
CREATE OR REPLACE VIEW source_stats AS
SELECT
  fs.id,
  fs.name,
  fs.category,
  fs.enabled,
  fs.last_fetched,
  fs.error_count,
  COUNT(p.id) as total_posts,
  MAX(p.pub_date) as latest_post_date,
  COUNT(CASE WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as posts_last_week
FROM feed_sources fs
LEFT JOIN posts p ON fs.id = p.source_id
GROUP BY fs.id, fs.name, fs.category, fs.enabled, fs.last_fetched, fs.error_count;

-- Comments for documentation
COMMENT ON TABLE feed_sources IS 'RSS feed sources configuration and status';
COMMENT ON TABLE posts IS 'Aggregated content from all feed sources';
COMMENT ON TABLE fetch_history IS 'Historical record of feed fetch operations';

COMMENT ON COLUMN posts.id IS 'Unique content ID generated from URL and pub_date hash';
COMMENT ON COLUMN posts.pub_date IS 'Original publication date from the feed';
COMMENT ON COLUMN feed_sources.priority IS '1=high (30-60min), 2=medium (120-180min), 3=low (240+min)';
COMMENT ON COLUMN feed_sources.update_interval IS 'How often to fetch this source in minutes';
