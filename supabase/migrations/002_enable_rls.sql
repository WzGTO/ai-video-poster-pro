-- ====================================
-- Row Level Security Policies
-- AI Video Poster Pro - Thai Edition
-- ====================================

-- ====================================
-- ENABLE RLS ON ALL TABLES
-- ====================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ====================================
-- HELPER FUNCTION: Get current user ID
-- ====================================
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  -- For NextAuth, user ID is passed via RLS context
  -- This can be set via: supabase.rpc('set_claim', { claim: 'user_id', value: userId })
  RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- USERS POLICIES
-- ====================================

-- Users can only view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = get_current_user_id() OR id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = get_current_user_id() OR id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (id = get_current_user_id() OR id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can do anything (for server-side operations)
DROP POLICY IF EXISTS "Service role full access to users" ON users;
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- USER TOKENS POLICIES
-- (Server-side only - no client access)
-- ====================================

-- Block all client access - only service role can access
DROP POLICY IF EXISTS "No client access to tokens" ON user_tokens;
CREATE POLICY "No client access to tokens"
  ON user_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- USER PAGES POLICIES
-- ====================================

-- Users can view their own pages
DROP POLICY IF EXISTS "Users can view own pages" ON user_pages;
CREATE POLICY "Users can view own pages"
  ON user_pages FOR SELECT
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can manage pages
DROP POLICY IF EXISTS "Service role full access to pages" ON user_pages;
CREATE POLICY "Service role full access to pages"
  ON user_pages FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- PRODUCTS POLICIES
-- ====================================

-- Users can view their own products
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own products
DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own products
DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own products
DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to products" ON products;
CREATE POLICY "Service role full access to products"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- VIDEOS POLICIES
-- ====================================

-- Users can view their own videos
DROP POLICY IF EXISTS "Users can view own videos" ON videos;
CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own videos
DROP POLICY IF EXISTS "Users can insert own videos" ON videos;
CREATE POLICY "Users can insert own videos"
  ON videos FOR INSERT
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own videos
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own videos
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;
CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to videos" ON videos;
CREATE POLICY "Service role full access to videos"
  ON videos FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- POSTS POLICIES
-- ====================================

-- Users can view their own posts
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own posts
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own posts
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own posts
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role full access (for cron jobs)
DROP POLICY IF EXISTS "Service role full access to posts" ON posts;
CREATE POLICY "Service role full access to posts"
  ON posts FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- TEMPLATES POLICIES
-- ====================================

-- Users can view their own templates
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can view public templates
DROP POLICY IF EXISTS "Users can view public templates" ON templates;
CREATE POLICY "Users can view public templates"
  ON templates FOR SELECT
  USING (is_public = true);

-- Users can insert their own templates
DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
CREATE POLICY "Users can insert own templates"
  ON templates FOR INSERT
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own templates
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own templates
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to templates" ON templates;
CREATE POLICY "Service role full access to templates"
  ON templates FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- DAILY ANALYTICS POLICIES
-- ====================================

-- Users can view their own analytics
DROP POLICY IF EXISTS "Users can view own analytics" ON daily_analytics;
CREATE POLICY "Users can view own analytics"
  ON daily_analytics FOR SELECT
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can insert/update analytics (for sync jobs)
DROP POLICY IF EXISTS "Service role full access to analytics" ON daily_analytics;
CREATE POLICY "Service role full access to analytics"
  ON daily_analytics FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- RATE LIMITS POLICIES
-- (System only - no client access)
-- ====================================

DROP POLICY IF EXISTS "Service role only for rate limits" ON rate_limits;
CREATE POLICY "Service role only for rate limits"
  ON rate_limits FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- AUDIT LOG POLICIES
-- (System only - no client access)
-- ====================================

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  USING (user_id = get_current_user_id() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can insert audit logs
DROP POLICY IF EXISTS "Service role full access to audit log" ON audit_log;
CREATE POLICY "Service role full access to audit log"
  ON audit_log FOR ALL
  USING (auth.role() = 'service_role');

-- ====================================
-- VERIFY RLS IS ENABLED
-- ====================================
DO $$
DECLARE
  table_name TEXT;
  rls_enabled BOOLEAN;
BEGIN
  FOR table_name, rls_enabled IN
    SELECT t.tablename, t.rowsecurity
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('users', 'user_tokens', 'user_pages', 'products', 'videos', 'posts', 'templates', 'daily_analytics', 'rate_limits', 'audit_log')
  LOOP
    IF NOT rls_enabled THEN
      RAISE WARNING 'RLS is NOT enabled on table: %', table_name;
    ELSE
      RAISE NOTICE 'RLS is enabled on table: %', table_name;
    END IF;
  END LOOP;
END $$;

-- ====================================
-- SUMMARY
-- ====================================
-- RLS Policies created:
-- 1. users - Own profile access only + service role
-- 2. user_tokens - Service role only (no client access)
-- 3. user_pages - Own pages + service role
-- 4. products - Full CRUD on own products
-- 5. videos - Full CRUD on own videos
-- 6. posts - Full CRUD on own posts
-- 7. templates - Own + public templates access
-- 8. daily_analytics - Read own + service role write
-- 9. rate_limits - Service role only
-- 10. audit_log - Read own + service role write
