-- =============================================
-- Migration: Add Social Media Post Fields
-- Date: 2024-12-12
-- Description: Add fields for video types, target types, and scheduling
-- =============================================

-- Add new columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'short',
ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'page',
ADD COLUMN IF NOT EXISTS target_id TEXT,
ADD COLUMN IF NOT EXISTS tiktok_product_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_title TEXT,
ADD COLUMN IF NOT EXISTS youtube_description TEXT,
ADD COLUMN IF NOT EXISTS youtube_tags TEXT[],
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update status column if needed
-- (Already exists with default 'pending', but ensure we have all expected statuses)
COMMENT ON COLUMN posts.status IS 'Post status: pending, scheduled, published, failed';
COMMENT ON COLUMN posts.video_type IS 'Video type: short, regular, reel';
COMMENT ON COLUMN posts.target_type IS 'Target type: page, profile';
COMMENT ON COLUMN posts.target_id IS 'Facebook Page ID or YouTube Channel ID';
COMMENT ON COLUMN posts.tiktok_product_id IS 'TikTok Shop Product ID for tagging';
COMMENT ON COLUMN posts.youtube_title IS 'YouTube video title';
COMMENT ON COLUMN posts.youtube_description IS 'YouTube video description';
COMMENT ON COLUMN posts.youtube_tags IS 'YouTube video tags array';
COMMENT ON COLUMN posts.error_message IS 'Error message if post failed';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_user_id_status ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_video_id ON posts(video_id);

-- Create index for scheduled posts query (used by cron job)
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_pending ON posts(scheduled_at, status) 
WHERE status = 'scheduled' AND posted_at IS NULL;

-- Add default_facebook_page_id to users table (for quick access)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS default_facebook_page_id TEXT;

-- =============================================
-- Sample Data Migration (if needed)
-- =============================================

-- Update existing posts with default values
UPDATE posts 
SET 
  video_type = COALESCE(video_type, 'short'),
  target_type = COALESCE(target_type, 'page')
WHERE video_type IS NULL OR target_type IS NULL;

