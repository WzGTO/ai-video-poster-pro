# 🚀 Deployment Guide - AI Video Poster Pro

คู่มือการ Deploy แอปพลิเคชันไปยัง Production

---

## 📋 Prerequisites (สิ่งที่ต้องเตรียม)

1. **GitHub Account** - สำหรับเก็บ source code
2. **Vercel Account** - สำหรับ hosting (ใช้ GitHub login ได้)
3. **Supabase Project** - สำหรับ database
4. **Google Cloud Project** - สำหรับ OAuth, Drive API, TTS
5. **TikTok Shop Developer Account** - สำหรับ TikTok API (Optional)
6. **Facebook Developer Account** - สำหรับ Facebook API (Optional)

---

## 📦 Step 1: Setup Supabase

### 1.1 สร้าง Project ใหม่

1. ไปที่ [supabase.com](https://supabase.com) และ Login
2. คลิก **"New Project"**
3. กรอกข้อมูล:
   - **Name**: `ai-video-poster-pro`
   - **Database Password**: สร้าง password ที่แข็งแกร่ง (เก็บไว้!)
   - **Region**: เลือกที่ใกล้ที่สุด (เช่น Singapore)
4. คลิก **"Create new project"** รอประมาณ 2 นาที

### 1.2 สร้าง Database Tables

ไปที่ **SQL Editor** และรัน SQL ต่อไปนี้:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  google_id TEXT UNIQUE,
  google_access_token TEXT,
  google_refresh_token TEXT,
  drive_folder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  category TEXT,
  stock INTEGER DEFAULT 0,
  tiktok_product_id TEXT,
  drive_folder_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0,
  step_message TEXT,
  script TEXT,
  duration INTEGER,
  aspect_ratio TEXT DEFAULT '9:16',
  file_size INTEGER,
  resolution TEXT,
  drive_file_id TEXT,
  public_url TEXT,
  thumbnail_url TEXT,
  models JSONB DEFAULT '{}',
  camera_angles TEXT[] DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  platform TEXT NOT NULL, -- tiktok, facebook, youtube
  status TEXT DEFAULT 'pending', -- pending, scheduled, posted, failed
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  post_id TEXT,
  post_url TEXT,
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Tokens table (Social Media)
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- tiktok, facebook, youtube
  access_token TEXT,
  refresh_token TEXT,
  open_id TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- User Pages table (Facebook Pages, YouTube Channels)
CREATE TABLE user_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,
  access_token TEXT,
  picture_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider, page_id)
);

-- Create indexes
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
```

### 1.3 ตั้งค่า Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pages ENABLE ROW LEVEL SECURITY;

-- For service role access (ใช้ service_role key)
-- Tables จะ bypass RLS เมื่อใช้ service_role key
```

### 1.4 ดึงค่า API Keys

ไปที่ **Settings > API** และคัดลอก:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔐 Step 2: Setup Google Cloud

### 2.1 สร้าง Project

1. ไปที่ [console.cloud.google.com](https://console.cloud.google.com)
2. คลิก **"Select a project"** > **"New Project"**
3. ตั้งชื่อ: `ai-video-poster-pro`
4. คลิก **"Create"**

### 2.2 เปิด APIs

ไปที่ **APIs & Services > Library** และเปิด:

- ✅ **Google Drive API**
- ✅ **Google Picker API**
- ✅ **Cloud Text-to-Speech API** (ถ้าใช้ Google TTS)

### 2.3 สร้าง OAuth Consent Screen

1. ไปที่ **APIs & Services > OAuth consent screen**
2. เลือก **"External"** > **"Create"**
3. กรอกข้อมูล:
   - App name: `AI Video Poster Pro`
   - User support email: อีเมลของคุณ
   - Developer contact: อีเมลของคุณ
4. **Scopes**: เพิ่ม
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/drive.file`
5. **Test users**: เพิ่มอีเมลของคุณ (ขณะ testing)

### 2.4 สร้าง OAuth Credentials

1. ไปที่ **APIs & Services > Credentials**
2. คลิก **"Create Credentials"** > **"OAuth client ID"**
3. เลือก **"Web application"**
4. กรอก:
   - Name: `AI Video Poster Pro`
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://your-app.vercel.app
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://your-app.vercel.app/api/auth/callback/google
     ```
5. คัดลอก:
   - `Client ID` → `GOOGLE_CLIENT_ID`
   - `Client secret` → `GOOGLE_CLIENT_SECRET`

---

## 🛒 Step 3: Setup TikTok Shop API (Optional)

### 3.1 สมัคร Developer Account

1. ไปที่ [partner.tiktokshop.com](https://partner.tiktokshop.com)
2. สมัครเป็น Developer Partner
3. รอการอนุมัติ (2-5 วันทำการ)

### 3.2 สร้าง App

1. ไปที่ **Developer Center > My Apps**
2. คลิก **"Create App"**
3. เลือก API permissions:
   - Products API
   - Content API
4. ตั้งค่า OAuth redirect:
   ```
   https://your-app.vercel.app/api/social/callback/tiktok
   ```
5. คัดลอก:
   - `App Key` → `TIKTOK_CLIENT_KEY`
   - `App Secret` → `TIKTOK_CLIENT_SECRET`

---

## 📘 Step 4: Setup Facebook API (Optional)

### 4.1 สร้าง Facebook App

1. ไปที่ [developers.facebook.com](https://developers.facebook.com)
2. คลิก **"Create App"**
3. เลือก **"Business"** > **"Next"**
4. กรอกข้อมูล App

### 4.2 ตั้งค่า Facebook Login

1. ไปที่ **Products > Facebook Login > Settings**
2. เปิด **"Client OAuth Login"**
3. เพิ่ม Valid OAuth Redirect URIs:
   ```
   https://your-app.vercel.app/api/social/callback/facebook
   ```
4. ไปที่ **Settings > Basic** และคัดลอก:
   - `App ID` → `FACEBOOK_APP_ID`
   - `App Secret` → `FACEBOOK_APP_SECRET`

---

## 🤖 Step 5: Setup AI APIs

### 5.1 Google AI Studio (Gemini)

1. ไปที่ [aistudio.google.com](https://aistudio.google.com)
2. คลิก **"Get API key"**
3. คัดลอก API key → `GEMINI_API_KEY`

### 5.2 Luma AI (Video Generation)

1. ไปที่ [lumalabs.ai](https://lumalabs.ai)
2. สมัครและสร้าง API key
3. คัดลอก → `LUMA_API_KEY`

### 5.3 iApp TTS (Thai TTS)

1. ไปที่ [iapp.co.th](https://iapp.co.th)
2. สมัครและสร้าง API key
3. คัดลอก → `IAPP_TTS_API_KEY`

---

## ⚙️ Step 6: Deploy to Vercel

### 6.1 Push to GitHub

```bash
# Initialize git (ถ้ายังไม่ได้)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create GitHub repo และ push
gh repo create ai-video-poster-pro --private --push
# หรือสร้าง repo บน GitHub แล้ว push
git remote add origin https://github.com/YOUR_USERNAME/ai-video-poster-pro.git
git push -u origin main
```

### 6.2 Connect to Vercel

1. ไปที่ [vercel.com](https://vercel.com) และ Login ด้วย GitHub
2. คลิก **"Add New..."** > **"Project"**
3. Import repository `ai-video-poster-pro`
4. ตั้งค่า:
   - Framework Preset: **Next.js**
   - Root Directory: `./`

### 6.3 ตั้งค่า Environment Variables

ใน Vercel project settings, ไปที่ **Settings > Environment Variables** และเพิ่ม:

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app

GOOGLE_CLIENT_ID=<from Google Cloud>
GOOGLE_CLIENT_SECRET=<from Google Cloud>

NEXT_PUBLIC_SUPABASE_URL=<from Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase>

TIKTOK_CLIENT_KEY=<from TikTok>
TIKTOK_CLIENT_SECRET=<from TikTok>

FACEBOOK_APP_ID=<from Facebook>
FACEBOOK_APP_SECRET=<from Facebook>

GEMINI_API_KEY=<from Google AI Studio>
LUMA_API_KEY=<from Luma>
IAPP_TTS_API_KEY=<from iApp>

CRON_SECRET=<generate: openssl rand -hex 16>
```

### 6.4 Deploy

1. คลิก **"Deploy"**
2. รอ build เสร็จ (ประมาณ 2-5 นาที)
3. เข้าใช้งานที่ `https://your-app.vercel.app`

---

## ⏰ Step 7: Setup Cron Job

Vercel จะรัน cron job อัตโนมัติตาม `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**หมายเหตุ**: Cron jobs ต้องใช้ Vercel Pro plan หรือสูงกว่า

### Alternative: ใช้ External Cron Service

ถ้าใช้ Vercel Free plan:

1. ใช้ [cron-job.org](https://cron-job.org) (ฟรี)
2. สร้าง job ที่ call:
   ```
   GET https://your-app.vercel.app/api/cron/publish-scheduled
   Header: Authorization: Bearer <CRON_SECRET>
   ```
3. ตั้งเวลา: ทุก 5 นาที

---

## 🔄 Step 8: Update OAuth Redirect URIs

หลัง deploy แล้ว อัปเดต redirect URIs ใน:

### Google Cloud
```
https://your-app.vercel.app/api/auth/callback/google
```

### TikTok Shop
```
https://your-app.vercel.app/api/social/callback/tiktok
```

### Facebook
```
https://your-app.vercel.app/api/social/callback/facebook
```

---

## ✅ Verification Checklist

- [ ] Supabase tables สร้างเรียบร้อย
- [ ] Google OAuth ทำงาน
- [ ] Login ได้
- [ ] Google Drive folder ถูกสร้าง
- [ ] สามารถ sync สินค้าจาก TikTok Shop
- [ ] สามารถสร้างวิดีโอ
- [ ] สามารถโพสต์ไปยัง social media
- [ ] Cron job ทำงาน

---

## 🐛 Troubleshooting

### Error: "Invalid redirect_uri"
- ตรวจสอบว่า redirect URI ตรงกับที่ตั้งใน OAuth settings

### Error: "CORS blocked"
- เพิ่ม domain ใน Supabase > Settings > API > Allowed origins

### Error: "Token expired" 
- ระบบจะ refresh token อัตโนมัติ แต่ถ้ามีปัญหา ให้ลอง logout แล้ว login ใหม่

### สร้างวิดีโอช้ามาก
- ตรวจสอบ API quota ของ AI services
- ลอง reduce video duration

---

## 📞 Support

หากพบปัญหา สามารถ:
1. ตรวจสอบ Vercel logs
2. ตรวจสอบ Supabase logs
3. เปิด Issue บน GitHub

---

**🎉 เสร็จเรียบร้อย!** แอปพลิเคชันพร้อมใช้งานแล้ว
