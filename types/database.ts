// ===== Database Types =====

// User
export interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    google_drive_folder_id: string | null;
    google_drive_folders: FolderStructure | null;
    created_at: string;
    updated_at: string;
}

export interface FolderStructure {
    root: string;
    products: string;
    videos: {
        root: string;
        originals: string;
        optimized: string;
        thumbnails: string;
    };
    audio: string;
    scripts: string;
    settings: string;
}

export interface GoogleProfile {
    id: string;
    email: string;
    name?: string | null;
    picture?: string | null;
}

// Product
export interface Product {
    id: string;
    user_id: string;
    tiktok_product_id: string | null;
    name: string;
    name_en: string | null;
    description: string | null;
    price: number;
    original_price: number | null;
    currency: string;
    images: string[];
    stock: number;
    category: string | null;
    commission_rate: number | null;
    is_active: boolean;
    synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProductFilters {
    category?: string;
    inStock?: boolean;
    search?: string;
    isActive?: boolean;
}

export interface ProductData {
    tiktok_product_id?: string;
    name: string;
    name_en?: string;
    description?: string;
    price: number;
    original_price?: number;
    currency?: string;
    images?: string[];
    stock?: number;
    category?: string;
    commission_rate?: number;
}

export interface TikTokProduct {
    id: string;
    title: string;
    description?: string;
    price: number;
    original_price?: number;
    currency?: string;
    images: string[];
    stock_info?: { available_stock: number };
    category?: { name: string };
}

// Video
export interface Video {
    id: string;
    user_id: string;
    product_id: string | null;
    title: string;
    script: string | null;
    duration: number | null;
    aspect_ratio: "9:16" | "16:9" | "1:1";
    style: string | null;
    voice: string | null;
    camera_angles: string[];
    effects: string[];
    model_text: string | null;
    model_video: string | null;
    status: VideoStatus;
    error_message: string | null;
    original_file_id: string | null;
    optimized_file_id: string | null;
    thumbnail_file_id: string | null;
    audio_file_id: string | null;
    public_url: string | null;
    thumbnail_url: string | null;
    watermark_enabled: boolean;
    watermark_text: string | null;
    watermark_position: string | null;
    created_at: string;
    updated_at: string;
}

export type VideoStatus =
    | "pending"
    | "generating_script"
    | "generating_video"
    | "adding_audio"
    | "adding_subtitles"
    | "optimizing"
    | "completed"
    | "failed";

export interface VideoFilters {
    status?: VideoStatus;
    productId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface VideoData {
    product_id?: string;
    title: string;
    script?: string;
    duration?: number;
    aspect_ratio?: "9:16" | "16:9" | "1:1";
    style?: string;
    voice?: string;
    camera_angles?: string[];
    effects?: string[];
    model_text?: string;
    model_video?: string;
    watermark_enabled?: boolean;
    watermark_text?: string;
    watermark_position?: string;
}

// Post
export interface Post {
    id: string;
    user_id: string;
    video_id: string;
    platform: Platform;
    post_id: string | null;
    post_url: string | null;
    caption: string | null;
    hashtags: string[];
    scheduled_at: string | null;
    posted_at: string | null;
    status: PostStatus;
    error_message: string | null;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    created_at: string;
    updated_at: string;
}

export type Platform = "tiktok" | "facebook" | "youtube" | "instagram";
export type PostStatus = "draft" | "scheduled" | "posting" | "posted" | "failed";

export interface PostFilters {
    platform?: Platform;
    status?: PostStatus;
    videoId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface PostData {
    video_id: string;
    platform: Platform;
    caption?: string;
    hashtags?: string[];
    scheduled_at?: string;
}

export interface PostAnalytics {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
}

// Pagination
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Sync Summary
export interface SyncSummary {
    total: number;
    created: number;
    updated: number;
    errors: number;
    products: Product[];
}

// Error Types
export class DatabaseError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = "DatabaseError";
    }
}

export class NotFoundError extends DatabaseError {
    constructor(entity: string, id: string) {
        super(`${entity} not found: ${id}`, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

export class UnauthorizedError extends DatabaseError {
    constructor(message: string = "ไม่มีสิทธิ์เข้าถึง") {
        super(message, "UNAUTHORIZED");
        this.name = "UnauthorizedError";
    }
}
