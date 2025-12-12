// Video Processing Queue and Types
// Handles async video creation workflow

import type { VideoStatus } from "@/types/database";

// ===== Types =====

export interface VideoCreationRequest {
    productId: string;
    mode: "auto" | "manual";
    images?: string[]; // drive_file_ids (manual mode)
    script?: string; // (manual mode)
    cameraAngles?: string[]; // (manual mode)
    effects?: string[];
    aspectRatio: "9:16" | "16:9" | "1:1";
    duration: number;
    style?: string;
    voice?: string;
    music?: string;
    models: {
        text: string;
        video: string;
        tts: string;
    };
    watermark: {
        enabled: boolean;
        text?: string;
        position?: string;
        opacity?: number;
    };
    subtitle: {
        enabled: boolean;
        style?: string;
        position?: string;
        color?: string;
    };
}

export interface VideoProcessingJob {
    videoId: string;
    userId: string;
    accessToken: string;
    request: VideoCreationRequest;
    status: VideoStatus;
    progress: number;
    currentStep: string;
    error?: string;
}

export interface ProcessingProgress {
    step: string;
    progress: number;
    message: string;
}

export const PROCESSING_STEPS = {
    INITIALIZING: { step: "initializing", progress: 0, message: "เริ่มต้น..." },
    ANALYZING: {
        step: "analyzing",
        progress: 10,
        message: "วิเคราะห์สินค้า...",
    },
    GENERATING_SCRIPT: {
        step: "generating_script",
        progress: 20,
        message: "สร้างบทพูด...",
    },
    DOWNLOADING_IMAGES: {
        step: "downloading_images",
        progress: 30,
        message: "ดาวน์โหลดรูปภาพ...",
    },
    GENERATING_VIDEO: {
        step: "generating_video",
        progress: 40,
        message: "สร้างวิดีโอ AI...",
    },
    GENERATING_VOICEOVER: {
        step: "generating_voiceover",
        progress: 60,
        message: "สร้างเสียงพากย์...",
    },
    ADDING_AUDIO: {
        step: "adding_audio",
        progress: 70,
        message: "ใส่เสียง...",
    },
    ADDING_SUBTITLES: {
        step: "adding_subtitles",
        progress: 75,
        message: "ใส่ซับไตเติ้ล...",
    },
    ADDING_WATERMARK: {
        step: "adding_watermark",
        progress: 80,
        message: "ใส่ watermark...",
    },
    ADDING_MUSIC: {
        step: "adding_music",
        progress: 85,
        message: "ใส่เพลงประกอบ...",
    },
    UPLOADING: {
        step: "uploading",
        progress: 90,
        message: "อัปโหลดวิดีโอ...",
    },
    OPTIMIZING: {
        step: "optimizing",
        progress: 95,
        message: "ปรับแต่งวิดีโอ...",
    },
    COMPLETED: { step: "completed", progress: 100, message: "เสร็จสิ้น!" },
    FAILED: { step: "failed", progress: 0, message: "เกิดข้อผิดพลาด" },
};

// In-memory job store (for demo - use Redis in production)
const jobStore = new Map<string, VideoProcessingJob>();

export function setJob(videoId: string, job: VideoProcessingJob): void {
    jobStore.set(videoId, job);
}

export function getJob(videoId: string): VideoProcessingJob | undefined {
    return jobStore.get(videoId);
}

export function updateJobProgress(
    videoId: string,
    progress: ProcessingProgress
): void {
    const job = jobStore.get(videoId);
    if (job) {
        job.currentStep = progress.step;
        job.progress = progress.progress;
        jobStore.set(videoId, job);
    }
}

export function updateJobStatus(
    videoId: string,
    status: VideoStatus,
    error?: string
): void {
    const job = jobStore.get(videoId);
    if (job) {
        job.status = status;
        if (error) {
            job.error = error;
        }
        jobStore.set(videoId, job);
    }
}

export function removeJob(videoId: string): void {
    jobStore.delete(videoId);
}

// ===== Retry Logic =====

export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
            }
        }
    }

    throw lastError;
}
