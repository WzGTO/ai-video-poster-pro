# 🌍 Environment Setup Guide

**Project:** AI Video Poster Pro  
**Last Updated:** 2025-12-12

---

## 📋 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Your app URL | `https://app.example.com` |
| `NEXTAUTH_SECRET` | Session encryption key | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | `eyJ...` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-xxx` |
| `GEMINI_API_KEY` | Gemini AI API key | `AIza...` |
| `TOKEN_ENCRYPTION_KEY` | Token encryption | 64 hex chars |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_AI_STUDIO_KEY` | Veo video generation | - |
| `LUMA_API_KEY` | Luma Dream Machine | - |
| `KLING_API_KEY` | Kling AI video | - |
| `GOOGLE_CLOUD_TTS_KEY` | Text-to-Speech | - |
| `IAPP_TTS_API_KEY` | Thai TTS | - |
| `CRON_SECRET` | Cron job auth | - |
| `SENTRY_DSN` | Error tracking | - |

---

## 🔐 Generating Secrets

### NEXTAUTH_SECRET

```bash
# Option 1: Using openssl
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### TOKEN_ENCRYPTION_KEY

```bash
# Must be exactly 64 hex characters (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CRON_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 🌐 Development Environment

### Create .env.local

```bash
cp .env.example .env.local
```

### Example .env.local

```env
# Core
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-secret-key-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# AI
GEMINI_API_KEY=AIza...

# Security
TOKEN_ENCRYPTION_KEY=64-hex-characters-here
```

---

## ☁️ Production Environment (Vercel)

### Setting Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)

### Encrypted Variables

Mark sensitive variables as "Encrypt":
- `NEXTAUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- All API keys

---

## 🔍 Validating Configuration

### Check Script

Create `scripts/check-env.js`:

```javascript
const required = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GEMINI_API_KEY',
  'TOKEN_ENCRYPTION_KEY',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
```

Run:
```bash
node scripts/check-env.js
```

---

## 🔑 API Key Sources

### Supabase Keys
- Dashboard → Settings → API
- Copy URL, anon key, service role key

### Google OAuth Credentials
1. [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID

### Gemini API Key
1. [Google AI Studio](https://aistudio.google.com)
2. Get API Key

### Video AI Keys
- **Luma:** [lumalabs.ai](https://lumalabs.ai)
- **Kling:** [klingai.com](https://klingai.com)

### TTS Keys
- **Google TTS:** [Google Cloud Console](https://console.cloud.google.com)
- **iApp:** [iapp.co.th](https://iapp.co.th)

---

## ⚠️ Security Best Practices

1. **Never commit secrets**
   - `.env.local` is in `.gitignore`
   - Use `.env.example` for documentation

2. **Rotate secrets regularly**
   - Update keys every 90 days
   - Immediately rotate if exposed

3. **Use minimum permissions**
   - OAuth scopes: only what's needed
   - Service role: server-side only

4. **Environment separation**
   - Different keys for dev/staging/prod
   - Never use production keys in development

---

**Last Updated:** 2025-12-12
