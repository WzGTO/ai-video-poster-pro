# 🚀 Pre-Deployment Checklist

> **AI Video Poster Pro - Thai Edition**  
> ใช้ checklist นี้ก่อน deploy ทุกครั้ง

---

## 🔐 Environment Setup

- [ ] ตั้งค่า Environment Variables ครบใน Vercel Dashboard
- [ ] ทดสอบ `.env.local` ใน local environment
- [ ] ตรวจสอบ API keys ทั้งหมดใช้งานได้
- [ ] ตรวจสอบ OAuth redirect URIs ถูกต้อง:
  - [ ] `https://your-domain.com/api/auth/callback/google`
  - [ ] `https://your-domain.com/api/social/callback/tiktok`
  - [ ] `https://your-domain.com/api/social/callback/facebook`
- [ ] ตรวจสอบ `NEXTAUTH_URL` ตรงกับ production domain
- [ ] ตรวจสอบ `CRON_SECRET` ถูกตั้งค่า

---

## 🗄️ Database (Supabase)

- [ ] Run migrations บน Supabase production:
  ```bash
  supabase db push --linked
  ```
- [ ] ตรวจสอบ RLS (Row Level Security) policies enabled:
  - [ ] `users` table
  - [ ] `videos` table
  - [ ] `posts` table
  - [ ] `products` table
  - [ ] `user_tokens` table
  - [ ] `user_pages` table
- [ ] ตรวจสอบ indexes ครบถ้วน
- [ ] Backup database (ถ้ามีข้อมูลแล้ว)
- [ ] ตรวจสอบ connection pooler enabled

---

## ☁️ Google Cloud Setup

- [ ] APIs enabled ทั้งหมด:
  - [ ] Google Drive API
  - [ ] Cloud Text-to-Speech API
  - [ ] YouTube Data API v3
  - [ ] Gemini API (Google AI Studio)
- [ ] OAuth consent screen configured:
  - [ ] App verified (production)
  - [ ] Scopes approved
  - [ ] Test users added (ถ้า verification pending)
- [ ] Quotas เพียงพอ:
  - [ ] Drive API: 10,000 queries/day
  - [ ] TTS API: 1M characters/month
  - [ ] YouTube API: 10,000 units/day
- [ ] Billing enabled (สำหรับ TTS API)

---

## 📱 Social Media Apps

### TikTok
- [ ] TikTok Developer App approved
- [ ] Sandbox mode disabled (production)
- [ ] Required scopes granted:
  - [ ] `user.info.basic`
  - [ ] `video.publish`
  - [ ] `video.upload`
- [ ] Webhook URLs configured (ถ้ามี)

### Facebook
- [ ] Facebook App in production mode (not development)
- [ ] App Review completed:
  - [ ] `pages_manage_posts`
  - [ ] `pages_read_engagement`
  - [ ] `publish_video`
- [ ] Valid OAuth redirect URIs
- [ ] Business verification (ถ้าจำเป็น)

### YouTube
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen verified
- [ ] Scopes requested:
  - [ ] `https://www.googleapis.com/auth/youtube.upload`
  - [ ] `https://www.googleapis.com/auth/youtube`

---

## ✅ Code Quality

- [ ] Run lint - no errors:
  ```bash
  npm run lint
  ```
- [ ] Run tests - all pass:
  ```bash
  npm test
  ```
- [ ] Run type check - no errors:
  ```bash
  npm run type-check
  ```
- [ ] Run build - successful:
  ```bash
  npm run build
  ```
- [ ] ไม่มี `console.log` ใน production code (ยกเว้น error logging)
- [ ] ไม่มี `TODO`/`FIXME` ที่เร่งด่วน
- [ ] ไม่มี commented-out code

---

## 🔒 Security

- [ ] ไม่มี hardcoded secrets ใน codebase
- [ ] ทุก API routes มี authentication check
- [ ] Input validation ทุกจุด (Zod schemas)
- [ ] CORS configured properly
- [ ] Rate limiting enabled (Upstash หรือ built-in)
- [ ] CSRF protection enabled
- [ ] Security headers configured:
  - [ ] `X-Frame-Options`
  - [ ] `X-Content-Type-Options`
  - [ ] `Referrer-Policy`
  - [ ] Content-Security-Policy (CSP)
- [ ] ไม่ส่ง sensitive tokens ไป client

---

## ⚡ Performance

- [ ] Images optimized (WebP format)
- [ ] Code splitting implemented (dynamic imports)
- [ ] API responses cached:
  - [ ] GET requests cached
  - [ ] Revalidation configured
- [ ] Database queries optimized:
  - [ ] No N+1 queries
  - [ ] Proper indexes
  - [ ] Pagination implemented
- [ ] Bundle size check:
  ```bash
  npm run build
  # Check .next/analyze if available
  ```
- [ ] First Load JS < 500KB (per route)
- [ ] Largest Contentful Paint (LCP) < 2.5s

---

## 🧪 Functionality Tests

### Authentication
- [ ] Login ด้วย Google
- [ ] Logout
- [ ] Session persistence
- [ ] Token refresh

### Social Media Connection
- [ ] Connect TikTok
- [ ] Connect Facebook
- [ ] Connect YouTube
- [ ] Disconnect แต่ละ platform
- [ ] Token expiry handling

### Products
- [ ] Sync products จาก TikTok Shop
- [ ] View product list
- [ ] View product details
- [ ] Delete product

### Video Creation
- [ ] สร้างวิดีโอ Auto mode
- [ ] สร้างวิดีโอ Manual mode
- [ ] Video processing status
- [ ] Script generation (AI)
- [ ] Voiceover generation (TTS)

### File Management
- [ ] อัปโหลดรูปภาพ
- [ ] Google Drive folder initialization
- [ ] View storage quota
- [ ] Delete files

### Posting
- [ ] โพสต์ทันที - TikTok
- [ ] โพสต์ทันที - Facebook (Page)
- [ ] โพสต์ทันที - Facebook (Reels)
- [ ] โพสต์ทันที - YouTube
- [ ] โพสต์ทันที - YouTube Shorts
- [ ] Schedule posts
- [ ] View scheduled posts
- [ ] Cancel scheduled post

### Analytics
- [ ] View analytics dashboard
- [ ] Date range filter
- [ ] Platform filter
- [ ] Charts render correctly

---

## 🎨 User Experience

- [ ] Loading states ทุกที่ (spinners, skeletons)
- [ ] Error messages ชัดเจน (ภาษาไทย)
- [ ] Success feedback (toasts, modals)
- [ ] Responsive design:
  - [ ] Mobile (< 640px)
  - [ ] Tablet (640px - 1024px)
  - [ ] Desktop (> 1024px)
- [ ] Dark mode ทำงานถูกต้อง
- [ ] Empty states (no data)
- [ ] Offline handling (graceful degradation)
- [ ] Accessibility:
  - [ ] Keyboard navigation
  - [ ] Focus indicators
  - [ ] Screen reader support

---

## 📚 Documentation

- [ ] `README.md` updated
- [ ] `DEPLOYMENT.md` complete
- [ ] `.env.example` up to date
- [ ] API documentation (if public)
- [ ] Changelog updated

---

## 📊 Monitoring

- [ ] Vercel Analytics enabled
- [ ] Error tracking configured:
  - [ ] Sentry (optional)
  - [ ] Vercel Error Monitoring
- [ ] Logs properly structured (JSON format)
- [ ] Alerts configured:
  - [ ] Build failures
  - [ ] Error rate spikes
  - [ ] API quota warnings

---

## ⚖️ Legal & Compliance

- [ ] Privacy Policy updated
- [ ] Terms of Service updated
- [ ] Cookie consent (ถ้าใช้)
- [ ] PDPA compliance (Thailand)
- [ ] GDPR compliance (ถ้ามี EU users)
- [ ] API usage terms compliance

---

## 🔄 Post-Deployment

- [ ] Monitor errors ใน Vercel/Sentry
- [ ] Check deployment logs
- [ ] Test production URLs:
  - [ ] Main app: `https://your-domain.com`
  - [ ] API health: `https://your-domain.com/api/health`
- [ ] Monitor API usage/quotas
- [ ] Test scheduled posts working (Vercel Cron)
- [ ] Verify webhooks receiving events

---

## 🔙 Rollback Plan

- [ ] มี backup version ใน Git
- [ ] รู้วิธี rollback ใน Vercel:
  ```
  Vercel Dashboard → Deployments → Previous → Promote to Production
  ```
- [ ] มีแผนสำรอง downtime
- [ ] ทีมรับทราบ rollback procedure
- [ ] Database migration rollback ready (ถ้าจำเป็น)

---

## 📝 Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| DevOps | | | |

---

## 🎯 Quick Commands

```bash
# Full pre-deployment check
./scripts/pre-deploy-check.sh

# Individual checks
npm run lint
npm run type-check  
npm test
npm run build

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

> **⚠️ หมายเหตุสำคัญ:**  
> ห้าม deploy ถ้ามี critical items ยังไม่ check ✅  
> ถ้ามี warnings สามารถ deploy ได้แต่ควรแก้ไขโดยเร็ว
