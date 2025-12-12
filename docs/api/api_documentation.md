# 📚 API Documentation

**Project:** AI Video Poster Pro  
**Version:** 1.0.0  
**Base URL:** `https://your-domain.vercel.app/api`

---

## 🔐 Authentication

All protected endpoints require authentication via NextAuth session.

### Headers
```
Cookie: next-auth.session-token=xxx
```

### Error Response
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

## 📹 Videos API

### List Videos
```http
GET /api/videos/list
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status (draft, processing, completed) |
| limit | number | Max results (default: 50) |
| offset | number | Pagination offset |

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "id": "uuid",
      "title": "Video Title",
      "status": "completed",
      "drive_url": "https://drive.google.com/...",
      "created_at": "2025-12-12T00:00:00Z"
    }
  ],
  "total": 100
}
```

---

### Create Video
```http
POST /api/videos/create
```

**Body:**
```json
{
  "productId": "uuid",
  "style": "tiktok",
  "duration": 10,
  "model": "veo-3.1"
}
```

**Response:**
```json
{
  "success": true,
  "videoId": "uuid",
  "status": "processing"
}
```

---

### Get Video Status
```http
GET /api/videos/status/{id}
```

**Response:**
```json
{
  "success": true,
  "status": "processing",
  "progress": 45,
  "estimatedTime": 120
}
```

---

## 📦 Products API

### List Products
```http
GET /api/products/list
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| source | string | Filter by source (tiktok, manual) |
| category | string | Filter by category |

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 299,
      "images": ["url1", "url2"]
    }
  ]
}
```

---

### Sync Products
```http
POST /api/products/sync
```

**Body:**
```json
{
  "source": "tiktok"
}
```

**Response:**
```json
{
  "success": true,
  "synced": 15,
  "failed": 0
}
```

---

## 📝 Posts API

### Create Post
```http
POST /api/posts/create
```

**Body:**
```json
{
  "videoId": "uuid",
  "platforms": ["tiktok", "facebook"],
  "title": "Post Title",
  "description": "Description",
  "hashtags": ["#trending"],
  "scheduledAt": "2025-12-13T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "postId": "uuid",
  "scheduled": true
}
```

---

### List Scheduled Posts
```http
GET /api/posts/schedule
```

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "uuid",
      "platform": "tiktok",
      "scheduledAt": "2025-12-13T10:00:00Z",
      "status": "pending"
    }
  ]
}
```

---

## 💾 Google Drive API

### Initialize Folders
```http
POST /api/drive/init
```

**Response:**
```json
{
  "success": true,
  "folders": {
    "root": "folder_id",
    "products": "folder_id",
    "videos": {
      "root": "folder_id",
      "originals": "folder_id",
      "optimized": "folder_id"
    }
  }
}
```

---

### Upload File
```http
POST /api/drive/upload
```

**Body:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| file | File | File to upload |
| targetFolder | string | products, videos, audio |
| filename | string | Optional custom filename |

**Response:**
```json
{
  "success": true,
  "fileId": "drive_file_id",
  "publicUrl": "https://drive.google.com/...",
  "size": 1024000
}
```

---

### Get Storage Info
```http
GET /api/drive/storage
```

**Response:**
```json
{
  "success": true,
  "quota": {
    "limit": 16106127360,
    "usage": 5368709120,
    "available": 10737418240,
    "percentUsed": 33.33
  }
}
```

---

## 🤖 AI Generation API

### Generate Script
```http
POST /api/generate-script
```

**Body:**
```json
{
  "productInfo": {
    "name": "Product Name",
    "price": 299,
    "description": "Description",
    "currency": "฿"
  },
  "style": "tiktok",
  "duration": 10,
  "modelChoice": "gemini-2.0-flash"
}
```

**Response:**
```json
{
  "script": "Generated Thai script...",
  "estimatedDuration": 10,
  "wordCount": 30
}
```

---

## 🔗 Social Connections API

### Get Connection Status
```http
GET /api/social/status
```

**Response:**
```json
{
  "tiktok": {
    "connected": true,
    "username": "@username",
    "expiresAt": "2025-12-20T00:00:00Z"
  },
  "facebook": {
    "connected": false
  },
  "youtube": {
    "connected": true,
    "channelName": "Channel Name"
  }
}
```

---

### Connect Platform
```http
GET /api/social/connect/{platform}
```

**Platforms:** `tiktok`, `facebook`, `youtube`

**Response:** Redirects to OAuth flow

---

## ⚠️ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | No permission |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| QUOTA_EXCEEDED | 507 | Storage full |
| INTERNAL_ERROR | 500 | Server error |

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/videos/create | 10 | 1 hour |
| /api/products/sync | 5 | 1 hour |
| /api/posts/create | 30 | 1 hour |
| /api/drive/upload | 30 | 1 minute |
| /api/generate-script | 10 | 1 minute |
| Default | 60 | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 3600
```

---

**Last Updated:** 2025-12-12
