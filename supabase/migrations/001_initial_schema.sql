-- ====================================
-- Initial Database Schema
-- AI Video Poster Pro - Thai Edition
-- ====================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- USERS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  
  -- Google Drive info
  google_drive_folder_id TEXT,
  google_drive_folders JSONB,
  
  -- Social connections (tokens จะเก็บใน separate encrypted table)
  tiktok_connected BOOLEAN DEFAULT FALSE,
  facebook_connected BOOLEAN DEFAULT FALSE,
  youtube_connected BOOLEAN DEFAULT FALSE,
  
  -- Quotas
  videos_created_count INTEGER DEFAULT 0,
  storage_used_mb DECIMAL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- USER TOKENS (Encrypted - Server-side only)
-- ====================================
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'tiktok', 'facebook', 'youtube', 'google'
  
  -- Encrypted tokens (JSON with iv, tag, encrypted)
  access_token TEXT,
  refresh_token TEXT,
  
  -- Token metadata
  token_expires_at TIMESTAMPTZ,
  open_id TEXT, -- For TikTok
  scope TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

-- ====================================
-- USER PAGES (Facebook Pages, YouTube Channels)
-- ====================================
CREATE TABLE IF NOT EXISTS user_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'facebook', 'youtube', 'tiktok'
  
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  picture_url TEXT,
  access_token TEXT, -- Page-specific access token (encrypted)
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider, page_id)
);

-- ====================================
-- PRODUCTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- TikTok Shop info
  tiktok_product_id TEXT,
  
  -- Product details
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  images JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  stock INTEGER DEFAULT 0,
  
  -- Affiliate info
  commission_rate DECIMAL,
  
  -- Sync info
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- VIDEOS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Video info
  title TEXT,
  
  -- Google Drive info
  original_file_id TEXT,
  optimized_file_id TEXT,
  thumbnail_file_id TEXT,
  audio_file_id TEXT,
  public_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  duration INTEGER, -- seconds
  aspect_ratio TEXT DEFAULT '9:16',
  resolution TEXT,
  file_size INTEGER, -- bytes
  
  -- Content
  script TEXT,
  camera_angles JSONB DEFAULT '[]'::jsonb,
  effects JSONB DEFAULT '[]'::jsonb,
  style TEXT,
  voice TEXT,
  
  -- AI models used
  model_text TEXT,
  model_video TEXT,
  model_tts TEXT,
  
  -- Settings
  watermark_enabled BOOLEAN DEFAULT TRUE,
  watermark_text TEXT,
  watermark_position TEXT DEFAULT 'bottom-right',
  subtitle_enabled BOOLEAN DEFAULT FALSE,
  subtitle_style TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'generating_script',
    'generating_video', 
    'adding_audio',
    'adding_subtitles',
    'optimizing',
    'completed',
    'failed'
  )),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- POSTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  
  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'youtube')),
  post_id TEXT,
  post_url TEXT,
  
  -- Content
  caption TEXT,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- TikTok specific
  tiktok_product_id TEXT,
  
  -- Facebook specific
  target_type TEXT CHECK (target_type IN ('page', 'profile', NULL)),
  target_id TEXT,
  
  -- Video type
  video_type TEXT DEFAULT 'short' CHECK (video_type IN ('short', 'regular', 'reel')),
  
  -- YouTube specific
  youtube_title TEXT,
  youtube_description TEXT,
  youtube_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Scheduling
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  
  -- Analytics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  cart_clicks INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TEMPLATES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  
  -- Visibility
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- DAILY ANALYTICS (Aggregated)
-- ====================================
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  cart_clicks INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, date)
);

-- ====================================
-- RATE LIMITS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identifier (user_id or IP)
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('user', 'ip')),
  
  -- Endpoint
  endpoint TEXT NOT NULL,
  
  -- Rate limit tracking
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(identifier, identifier_type, endpoint, window_start)
);

-- ====================================
-- AUDIT LOG TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- INDEXES
-- ====================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User tokens
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_provider ON user_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires ON user_tokens(token_expires_at);

-- User pages
CREATE INDEX IF NOT EXISTS idx_user_pages_user_provider ON user_pages(user_id, provider);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_tiktok_id ON products(tiktok_product_id);
CREATE INDEX IF NOT EXISTS idx_products_synced_at ON products(synced_at DESC);

-- Videos
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_product_id ON videos(product_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_video_id ON posts(video_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public) WHERE is_public = TRUE;

-- Daily analytics
CREATE INDEX IF NOT EXISTS idx_daily_analytics_user ON daily_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_post_date ON daily_analytics(post_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- Rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(identifier, endpoint, window_start);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ====================================
-- UPDATED_AT TRIGGER FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- APPLY TRIGGERS
-- ====================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;
CREATE TRIGGER update_user_tokens_updated_at 
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_pages_updated_at ON user_pages;
CREATE TRIGGER update_user_pages_updated_at 
  BEFORE UPDATE ON user_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- SUMMARY
-- ====================================
-- Tables created:
-- 1. users - User accounts
-- 2. user_tokens - Encrypted OAuth tokens
-- 3. user_pages - Facebook pages, YouTube channels
-- 4. products - TikTok Shop products
-- 5. videos - Generated videos
-- 6. posts - Social media posts
-- 7. templates - Video templates
-- 8. daily_analytics - Aggregated analytics
-- 9. rate_limits - API rate limiting
-- 10. audit_log - Security audit trail
