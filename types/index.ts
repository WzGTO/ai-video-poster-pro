// Type definitions for AI Video Poster Pro

// Product from TikTok Shop
export interface Product {
    id: string;
    productIdTiktok: string;
    name: string;
    nameEn?: string;
    description?: string;
    price: number;
    currency: string;
    images: string[];
    stock: number;
    category?: string;
    commissionRate?: number;
    syncedAt: string;
}

// Video metadata
export interface Video {
    id: string;
    productId: string;
    script: string;
    duration: number;
    aspectRatio: "9:16" | "16:9" | "1:1";
    cameraAngles: CameraAngle[];
    effects: Effect[];
    modelUsedText: string;
    modelUsedVideo: string;
    watermarkEnabled: boolean;
    watermarkText?: string;
    watermarkPosition?: WatermarkPosition;
    watermarkOpacity?: number;
    status: "pending" | "processing" | "completed" | "failed";
    videoUrl?: string;
    thumbnailUrl?: string;
    createdAt: string;
}

// Camera angle options
export interface CameraAngle {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: "basic" | "movement" | "creative" | "effect";
}

// Video effect
export interface Effect {
    id: string;
    name: string;
    icon: string;
    description: string;
}

// Watermark position
export type WatermarkPosition =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";

// User settings
export interface UserSettings {
    defaultVoice?: string;
    defaultStyle?: string;
    defaultDuration?: number;
    autoWatermark?: boolean;
    watermarkPosition?: WatermarkPosition;
    watermarkOpacity?: number;
}

// Social media post
export interface Post {
    id: string;
    videoId: string;
    platform: "tiktok" | "facebook" | "youtube" | "instagram";
    postUrl?: string;
    postId?: string;
    caption?: string;
    hashtags: string[];
    status: "pending" | "scheduled" | "published" | "posted" | "failed";
    postedAt?: string;
    scheduledAt?: string;
    views?: number;
    likes?: number;
    shares?: number;
    clicks?: number;
    comments?: number;
    // New fields for video type and targeting
    videoType?: "short" | "regular" | "reel";
    targetType?: "page" | "profile";
    targetId?: string; // Facebook Page ID or YouTube Channel ID
    errorMessage?: string;
}

// AI Model options
export interface TextModel {
    id: string;
    name: string;
    description: string;
    provider: string;
    free: boolean;
    recommended?: boolean;
}

export interface VideoModel {
    id: string;
    name: string;
    description: string;
    provider: string;
    free: boolean;
    freeLimit?: string;
    recommended?: boolean;
}

// Thai Voice options for TTS
export interface ThaiVoice {
    id: string;
    name: string;
    provider: string;
    gender: "male" | "female" | "neutral";
    description: string;
}

// Ad style options
export type AdStyle =
    | "auto"
    | "minimal"
    | "fun"
    | "professional"
    | "tiktok"
    | "premium"
    | "musthave"
    | "cute";

// Video creation form data
export interface VideoCreationForm {
    productId: string;
    mode: "auto" | "manual";
    aspectRatio: "9:16" | "16:9" | "1:1";
    duration: number | "auto";
    style: AdStyle;
    voice: string;
    highlights?: string;
    script?: string;
    images: string[];
    cameraAngles: string[];
    effects: string[];
    watermark: {
        enabled: boolean;
        text: string;
        position: WatermarkPosition;
        opacity: number;
    };
    subtitle: {
        enabled: boolean;
        style: string;
        position: "top" | "center" | "bottom";
        color: string;
    };
    music?: {
        id: string;
        volume: number;
    };
}

// Processing step
export interface ProcessingStep {
    id: string;
    name: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
