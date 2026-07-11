-- Create tables for storing filtered content from the keyword filter system
-- These tables log items that were rejected or marked for review

-- Table for rejected articles
CREATE TABLE filter_rejected (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  snippet TEXT,
  url TEXT NOT NULL,
  source TEXT,
  category TEXT,
  original_pub_date TIMESTAMPTZ,
  filter_score DECIMAL(5,3),
  filter_reasoning TEXT,
  filtered_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT -- 'confirm_reject' | 'override_approve'
);

-- Table for articles pending review
CREATE TABLE filter_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  snippet TEXT,
  url TEXT NOT NULL,
  source TEXT,
  category TEXT,
  original_pub_date TIMESTAMPTZ,
  filter_score DECIMAL(5,3),
  filter_reasoning TEXT,
  filtered_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT -- 'approve' | 'reject'
);

-- Indexes for efficient querying
CREATE INDEX idx_filter_rejected_reviewed ON filter_rejected(reviewed);
CREATE INDEX idx_filter_rejected_filtered_at ON filter_rejected(filtered_at DESC);
CREATE INDEX idx_filter_rejected_url ON filter_rejected(url);

CREATE INDEX idx_filter_review_reviewed ON filter_review(reviewed);
CREATE INDEX idx_filter_review_filtered_at ON filter_review(filtered_at DESC);
CREATE INDEX idx_filter_review_url ON filter_review(url);

-- Add comments for documentation
COMMENT ON TABLE filter_rejected IS 'Stores articles rejected by the keyword filter';
COMMENT ON TABLE filter_review IS 'Stores articles marked for manual review by the keyword filter';

COMMENT ON COLUMN filter_rejected.filter_score IS 'The numeric score from the keyword filter';
COMMENT ON COLUMN filter_rejected.filter_reasoning IS 'JSON object with detailed scoring breakdown';
COMMENT ON COLUMN filter_rejected.review_decision IS 'Manual review outcome: confirm_reject or override_approve';

COMMENT ON COLUMN filter_review.filter_score IS 'The numeric score from the keyword filter (typically between -0.5 and 1.2)';
COMMENT ON COLUMN filter_review.filter_reasoning IS 'JSON object with detailed scoring breakdown';
COMMENT ON COLUMN filter_review.review_decision IS 'Manual review outcome: approve or reject';
