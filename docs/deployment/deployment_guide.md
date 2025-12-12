# 🚀 Deployment Guide

**Project:** AI Video Poster Pro  
**Version:** 1.0.0  
**Platform:** Vercel + Supabase  

---

## 📋 Prerequisites

### Accounts Required
- [ ] [Vercel](https://vercel.com) account
- [ ] [Supabase](https://supabase.com) project
- [ ] [Google Cloud Console](https://console.cloud.google.com) project
- [ ] [Google AI Studio](https://aistudio.google.com) access

### Tools Required
- Node.js 18+
- npm or pnpm
- Git

---

## 🔧 Step 1: Environment Setup

### 1.1 Clone Repository

```bash
git clone https://github.com/your-repo/ai-video-poster-pro.git
cd ai-video-poster-pro
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Create Environment File

```bash
cp .env.example .env.local
```

### 1.4 Configure Environment Variables

Edit `.env.local` with your values:

```env
# ===== CORE =====
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-32-char-secret-here

# ===== SUPABASE =====
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ===== GOOGLE =====
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# ===== AI =====
GEMINI_API_KEY=AIza...
GOOGLE_AI_STUDIO_KEY=AIza...

# ===== SECURITY =====
TOKEN_ENCRYPTION_KEY=generated-64-hex-chars
CRON_SECRET=your-cron-secret
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for provisioning (~2 min)

### 2.2 Run Migrations

In Supabase SQL Editor, run:

```sql
-- 1. Initial schema
-- Copy content from supabase/migrations/001_initial_schema.sql

-- 2. Enable RLS
-- Copy content from supabase/migrations/002_enable_rls.sql
```

### 2.3 Verify Setup

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should show TRUE
```

---

## ☁️ Step 3: Google Cloud Setup

### 3.1 Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable APIs:
   - Google Drive API
   - Google Cloud Text-to-Speech API

### 3.2 Configure OAuth

1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```

### 3.3 Get API Keys

1. Go to [AI Studio](https://aistudio.google.com)
2. Create API key for Gemini

---

## 🚀 Step 4: Deploy to Vercel

### 4.1 Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import GitHub repository
3. Select project

### 4.2 Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

Add all variables from `.env.local`

### 4.3 Deploy

```bash
# Or use Vercel CLI
vercel --prod
```

### 4.4 Configure Domain

1. Go to Settings → Domains
2. Add custom domain
3. Update OAuth redirect URIs

---

## ✅ Step 5: Post-Deployment

### 5.1 Verify Deployment

1. Visit your domain
2. Test Google login
3. Test Google Drive integration
4. Create test video

### 5.2 Enable Cron Jobs

Vercel automatically runs cron jobs defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-scheduled",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-rate-limits",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 5.3 Setup Monitoring

1. Enable Vercel Analytics
2. Configure Sentry (optional)
3. Set up alerts

---

## 🔐 Security Checklist

- [ ] NEXTAUTH_SECRET is unique and secure
- [ ] TOKEN_ENCRYPTION_KEY is 64 hex characters
- [ ] CRON_SECRET is set
- [ ] OAuth redirect URIs are production URLs
- [ ] SUPABASE_SERVICE_ROLE_KEY is not exposed to client
- [ ] RLS is enabled on all tables

---

## 🐛 Troubleshooting

### OAuth Error
- Check redirect URIs match exactly
- Verify client ID and secret

### Database Error
- Check Supabase URL and keys
- Verify RLS policies

### API Error
- Check API keys are valid
- Verify quota not exceeded

See [Troubleshooting Guide](./troubleshooting.md) for more.

---

## 📦 Rollback

### Vercel Rollback

1. Go to Deployments
2. Find previous stable deployment
3. Click "..." → "Promote to Production"

### Database Rollback

```sql
-- Backup before changes
-- Use Supabase dashboard for point-in-time recovery
```

---

## 📊 Maintenance

### Daily
- Monitor error rates
- Check API quotas

### Weekly
- Review performance metrics
- Check storage usage

### Monthly
- Security updates
- Dependency updates
- Database cleanup

---

**Last Updated:** 2025-12-12
