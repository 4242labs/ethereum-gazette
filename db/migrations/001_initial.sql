-- Migration 001: Initial Schema
-- Created: 2024-12-28
-- Description: Create initial tables for RSS feed aggregation

-- Feed Sources Table
CREATE TABLE IF NOT EXISTS feed_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  update_interval INTEGER DEFAULT 120,
  last_fetched TIMESTAMP,
  last_success TIMESTAMP,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts Table
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
  raw_content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_pub_date ON posts(pub_date DESC);
CREATE INDEX idx_posts_source_id ON posts(source_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_category_date ON posts(category, pub_date DESC);
CREATE INDEX idx_sources_category ON feed_sources(category);
CREATE INDEX idx_sources_enabled ON feed_sources(enabled);
CREATE INDEX idx_sources_last_fetched ON feed_sources(last_fetched);

-- Fetch History Table
CREATE TABLE IF NOT EXISTS fetch_history (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES feed_sources(id) ON DELETE CASCADE,
  fetch_time TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  items_count INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_fetch_history_source ON fetch_history(source_id, fetch_time DESC);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON feed_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data from feed-sources.json will be inserted separately
