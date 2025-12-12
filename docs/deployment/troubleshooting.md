# 🔧 Troubleshooting Guide

**Project:** AI Video Poster Pro  
**Last Updated:** 2025-12-12

---

## 🔐 Authentication Issues

### Problem: "Invalid credentials" on Google Login

**Symptoms:**
- Cannot sign in with Google
- Redirect loop
- Error message about credentials

**Solutions:**

1. **Check OAuth Redirect URI**
   ```
   # Must match exactly:
   https://your-domain.vercel.app/api/auth/callback/google
   ```

2. **Verify Environment Variables**
   ```bash
   # Check in Vercel dashboard:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - NEXTAUTH_URL (should match your domain)
   - NEXTAUTH_SECRET (32+ characters)
   ```

3. **Clear Cookies**
   - Clear browser cookies for your domain
   - Try incognito mode

---

### Problem: "RefreshAccessTokenError"

**Symptoms:**
- User gets logged out randomly
- "Session expired" errors

**Solutions:**

1. **Check Google OAuth Consent Screen**
   - Ensure app is in "Production" mode
   - OR add your email as a test user

2. **Verify refresh token scopes**
   ```javascript
   // In lib/auth.ts, ensure:
   access_type: "offline",
   prompt: "consent"
   ```

3. **Revoke and re-grant permissions**
   - Go to https://myaccount.google.com/permissions
   - Remove app access
   - Sign in again

---

## 🗄️ Database Issues

### Problem: "Row Level Security violation"

**Symptoms:**
- Data not loading
- Insert/update fails
- Error about RLS

**Solutions:**

1. **Check RLS is properly configured**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Verify user ID is passed correctly**
   ```typescript
   // In queries, ensure:
   .eq('user_id', session.user.id)
   ```

3. **Check session has user ID**
   ```typescript
   const session = await auth();
   console.log('User ID:', session?.user?.id);
   ```

---

### Problem: "Table does not exist"

**Solutions:**

1. Run migrations in order:
   ```sql
   -- Run 001_initial_schema.sql first
   -- Then 002_enable_rls.sql
   ```

2. Check connection to correct Supabase project

---

## ☁️ Google Drive Issues

### Problem: "Google Drive folders not initialized"

**Solutions:**

1. **Initialize folders**
   ```bash
   # Call the init endpoint:
   POST /api/drive/init
   ```

2. **Check Google Drive access**
   - Verify Drive API is enabled
   - Check OAuth scopes include Drive

3. **Manual check**
   - Sign out and sign back in
   - Re-grant Google permissions

---

### Problem: "Quota exceeded" on Google Drive

**Solutions:**

1. **Check storage quota**
   ```bash
   GET /api/drive/storage
   ```

2. **Free up space**
   - Delete old videos
   - Empty Google Drive trash

3. **Upgrade storage**
   - Purchase Google One

---

## 🤖 AI Generation Issues

### Problem: "Gemini API error"

**Symptoms:**
- Script generation fails
- "Invalid API key" error

**Solutions:**

1. **Verify API Key**
   ```bash
   # Test key:
   curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY"
   ```

2. **Check quota**
   - Go to Google AI Studio
   - Check rate limits

3. **Try different model**
   ```typescript
   // In generate-script, try:
   modelName = "gemini-1.5-pro-latest"
   ```

---

### Problem: "Video generation timeout"

**Solutions:**

1. **Check API status**
   - Veo, Luma, Kling may have downtime

2. **Verify timeout settings**
   ```javascript
   // In vercel.json:
   "maxDuration": 300  // 5 minutes
   ```

3. **Use mock mode for testing**
   ```typescript
   model: 'mock'
   ```

---

## 🌐 Deployment Issues

### Problem: Build fails on Vercel

**Symptoms:**
- "Module not found" errors
- TypeScript errors

**Solutions:**

1. **Check local build first**
   ```bash
   npm run build
   ```

2. **Verify all dependencies**
   ```bash
   npm install
   ```

3. **Check environment variables**
   - All required vars set in Vercel

---

### Problem: API routes return 500

**Solutions:**

1. **Check Vercel function logs**
   - Go to Vercel → Functions → Logs

2. **Verify environment variables**
   - Check all required vars are set

3. **Check Supabase connection**
   - Verify URL and keys

---

## 🔄 Cron Job Issues

### Problem: Scheduled posts not publishing

**Solutions:**

1. **Check cron job status**
   - Vercel → Settings → Cron Jobs

2. **Verify CRON_SECRET**
   ```bash
   # Must be set in Vercel env vars
   CRON_SECRET=your-secret
   ```

3. **Check logs**
   - View `/api/cron/process-scheduled` logs

4. **Test manually**
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
        https://your-domain/api/cron/process-scheduled
   ```

---

## 📱 Frontend Issues

### Problem: Page shows blank/white screen

**Solutions:**

1. **Check browser console**
   - Look for JavaScript errors

2. **Clear cache**
   ```bash
   # Hard refresh:
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

3. **Check ErrorBoundary**
   - Component may have thrown error

---

### Problem: Styles not loading

**Solutions:**

1. **Check globals.css import**
   ```typescript
   // In app/layout.tsx:
   import "./globals.css"
   ```

2. **Verify Tailwind config**
   ```javascript
   // tailwind.config.js content paths correct
   ```

---

## 🚨 Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `UNAUTHORIZED` | Not logged in | Redirect to login |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `QUOTA_EXCEEDED` | Storage full | Free up space |
| `FOLDER_NOT_FOUND` | Drive not initialized | Call /api/drive/init |
| `INVALID_FILE_TYPE` | Wrong file format | Check allowed types |
| `FILE_TOO_LARGE` | File > 100MB | Compress file |

---

## 📞 Getting Help

1. **Check logs first**
   - Vercel logs
   - Browser console
   - Supabase logs

2. **Search issues**
   - GitHub issues page

3. **Contact support**
   - support@ai-video-poster-pro.app

---

## 🔍 Debug Mode

Enable debug logging:

```typescript
// In .env.local:
LOG_LEVEL=debug
```

View detailed logs:
```typescript
import { logger } from '@/lib/logger';
logger.debug('Debug info', { data });
```

---

**Last Updated:** 2025-12-12
