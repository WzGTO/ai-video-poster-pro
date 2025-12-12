# 🎬 AI Video Poster Pro - Thai Edition

> **ระบบสร้างวิดีโอโฆษณาด้วย AI และโพสต์อัตโนมัติไปยัง TikTok Shop, Facebook, YouTube**

---

## 🌟 ไฮไลท์พิเศษ

✨ **ข้อมูลเก็บบน Google Drive ของคุณ** - ไม่มีการเก็บข้อมูลถาวรบนเซิร์ฟเวอร์

🔒 **ปลอดภัย 100%** - คุณเป็นเจ้าของข้อมูลของคุณเอง

☁️ **เข้าถึงได้ทุกที่** - Login ด้วย Google account เดิมก็ใช้งานได้เลย

---

## ✨ Features

### 🔐 Authentication
- Google OAuth (รวม Google Drive + YouTube scopes)
- TikTok Shop integration
- Facebook Page connection

### 🎥 Video Creation
- **โหมด Auto**: ให้ AI สร้างทุกอย่าง - 2 นาทีเสร็จ
- **โหมด Manual**: ควบคุมเองทุกขั้นตอน
- 15+ AI Models: Gemini, Veo, Luma, Kling, Runway
- เลือกมุมกล้องและ Effects 39+ แบบ

### 📤 Multi-Platform Posting
- TikTok Shop (พร้อมปักตะกร้า)
- Facebook Page
- YouTube Shorts
- Instagram Reels

### 🎨 Thai Language Support
- UI ภาษาไทย 100%
- เสียงพากย์ภาษาไทย
- ฟอนต์ไทย: Kanit, Prompt, Sarabun

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Google Account**

### Installation

1. **Clone and install**
```bash
cd d:\Web\AutoPost
npm install
```

2. **Set up environment variables**
```bash
copy .env.example .env.local
```

แก้ไขไฟล์ `.env.local` และใส่ API keys ของคุณ

3. **Run development server**
```bash
npm run dev
```

เปิด http://localhost:3000

---

## 📁 Project Structure

```
ai-video-poster-pro/
├── app/
│   ├── (auth)/                 # Auth pages (login)
│   ├── (dashboard)/            # Dashboard pages
│   ├── api/                    # API routes
│   │   └── auth/               # NextAuth routes
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── forms/                  # Form components
│   └── cards/                  # Card components
├── lib/
│   ├── api/                    # API utilities
│   ├── google-drive.ts         # Google Drive integration
│   ├── store.ts                # Zustand store
│   └── utils.ts                # Utility functions
├── types/
│   └── index.ts                # TypeScript definitions
├── public/                     # Static assets
├── .env.example                # Environment template
├── package.json                # Dependencies
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── components.json             # shadcn/ui configuration
```

---

## 🔧 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js v5 |
| State | Zustand |
| Storage | Google Drive API |
| Icons | Lucide React |
| Forms | React Hook Form (planned) |

---

## 🎨 Design System

### Thai Fonts
- **Kanit**: หัวข้อ พาดหัวใหญ่
- **Prompt**: เนื้อหาทั่วไป
- **Sarabun**: ปุ่ม ตัวอักษรเล็ก

### Colors
- **Primary Blue**: #3B82F6
- **Success Green**: #10B981
- **AI Purple**: #8B5CF6
- **Warning Orange**: #F59E0B
- **Danger Red**: #EF4444

### Dark Mode
รองรับ Dark mode ผ่าน CSS variables และ Tailwind

---

## 📦 Dependencies

### Production
- `next`, `react`, `react-dom` - Core
- `next-auth` - Authentication
- `@supabase/supabase-js` - Realtime (optional)
- `googleapis` - Google Drive API
- `zustand` - State management
- `lucide-react` - Icons
- `date-fns` - Date utilities
- `react-dropzone` - File upload
- `@radix-ui/*` - UI primitives (shadcn)

### Development
- `typescript` - Type checking
- `tailwindcss`, `postcss`, `autoprefixer` - Styling
- `eslint`, `eslint-config-next` - Linting

---

## 📖 คู่มือติดตั้งภาษาไทย

อ่านคู่มือติดตั้งฉบับเต็มได้ที่ [INSTALL_TH.md](./INSTALL_TH.md)

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy!

---

Made with ❤️ in Thailand 🇹🇭
