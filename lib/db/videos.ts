import { supabase } from "@/lib/supabase";
import type {
    Video,
    VideoFilters,
    VideoData,
    VideoStatus,
    PaginationParams,
    PaginatedResult,
} from "@/types/database";

// ===== Video Functions =====

/**
 * สร้าง video record ใหม่
 */
export async function createVideo(
    userId: string,
    videoData: VideoData
): Promise<Video> {
    const { data, error } = await supabase
        .from("videos")
        .insert({
            user_id: userId,
            title: videoData.title,
            product_id: videoData.product_id || null,
            script: videoData.script || null,
            duration: videoData.duration || null,
            aspect_ratio: videoData.aspect_ratio || "9:16",
            style: videoData.style || null,
            voice: videoData.voice || null,
            camera_angles: videoData.camera_angles || [],
            effects: videoData.effects || [],
            model_text: videoData.model_text || null,
            model_video: videoData.model_video || null,
            watermark_enabled: videoData.watermark_enabled ?? true,
            watermark_text: videoData.watermark_text || "Created with AI 🤖",
            watermark_position: videoData.watermark_position || "bottom-right",
            status: "pending" as VideoStatus,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create video: ${error.message}`);
    }

    return data as Video;
}

/**
 * ดึง videos ทั้งหมดของ user พร้อม filters และ pagination
 */
export async function getVideos(
    userId: string,
    filters?: VideoFilters,
    pagination?: PaginationParams
): Promise<PaginatedResult<Video>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
        .from("videos")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

    // Apply filters
    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    if (filters?.productId) {
        query = query.eq("product_id", filters.productId);
    }

    if (filters?.search) {
        query = query.or(
            `title.ilike.%${filters.search}%,script.ilike.%${filters.search}%`
        );
    }

    if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
    }

    if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
    }

    // Apply pagination and sorting
    query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Failed to get videos: ${error.message}`);
    }

    const total = count || 0;

    return {
        data: (data as Video[]) || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * ดึง video ตาม ID
 */
export async function getVideoById(
    videoId: string,
    userId: string
): Promise<Video | null> {
    const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .eq("user_id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        throw new Error(`Failed to get video: ${error.message}`);
    }

    return data as Video;
}

/**
 * อัปเดตสถานะ video
 */
export async function updateVideoStatus(
    videoId: string,
    userId: string,
    status: VideoStatus,
    errorMessage?: string
): Promise<Video> {
    const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (errorMessage !== undefined) {
        updates.error_message = errorMessage;
    }

    // Clear error message when status is not failed
    if (status !== "failed") {
        updates.error_message = null;
    }

    const { data, error } = await supabase
        .from("videos")
        .update(updates)
        .eq("id", videoId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update video status: ${error.message}`);
    }

    return data as Video;
}

/**
 * อัปเดต video data
 */
export async function updateVideo(
    videoId: string,
    userId: string,
    updates: Partial<Video>
): Promise<Video> {
    // Remove fields that shouldn't be updated directly
    const { id, user_id, created_at, ...safeUpdates } = updates;

    const { data, error } = await supabase
        .from("videos")
        .update({
            ...safeUpdates,
            updated_at: new Date().toISOString(),
        })
        .eq("id", videoId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update video: ${error.message}`);
    }

    return data as Video;
}

/**
 * อัปเดต video file IDs
 */
export async function updateVideoFiles(
    videoId: string,
    userId: string,
    fileIds: {
        original_file_id?: string;
        optimized_file_id?: string;
        thumbnail_file_id?: string;
        audio_file_id?: string;
        public_url?: string;
        thumbnail_url?: string;
    }
): Promise<Video> {
    const { data, error } = await supabase
        .from("videos")
        .update({
            ...fileIds,
            updated_at: new Date().toISOString(),
        })
        .eq("id", videoId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update video files: ${error.message}`);
    }

    return data as Video;
}

/**
 * ลบ video record
 */
export async function deleteVideo(
    videoId: string,
    userId: string
): Promise<boolean> {
    const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to delete video: ${error.message}`);
    }

    return true;
}

/**
 * ดึง videos ของสินค้า
 */
export async function getVideosByProduct(
    productId: string,
    userId: string
): Promise<Video[]> {
    const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Failed to get videos: ${error.message}`);
    }

    return (data as Video[]) || [];
}

/**
 * ดึงสถิติ videos
 */
export async function getVideoStats(userId: string): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
    pending: number;
}> {
    const { data, error } = await supabase
        .from("videos")
        .select("status")
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to get stats: ${error.message}`);
    }

    const videos = data || [];
    const processingStatuses: VideoStatus[] = [
        "generating_script",
        "generating_video",
        "adding_audio",
        "adding_subtitles",
        "optimizing",
    ];

    return {
        total: videos.length,
        completed: videos.filter((v) => v.status === "completed").length,
        processing: videos.filter((v) => processingStatuses.includes(v.status))
            .length,
        failed: videos.filter((v) => v.status === "failed").length,
        pending: videos.filter((v) => v.status === "pending").length,
    };
}

/**
 * ดึง recent videos
 */
export async function getRecentVideos(
    userId: string,
    limit: number = 5
): Promise<Video[]> {
    const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Failed to get recent videos: ${error.message}`);
    }

    return (data as Video[]) || [];
}

/**
 * ตรวจสอบว่า video อยู่ระหว่างการประมวลผลหรือไม่
 */
export function isVideoProcessing(video: Video): boolean {
    const processingStatuses: VideoStatus[] = [
        "generating_script",
        "generating_video",
        "adding_audio",
        "adding_subtitles",
        "optimizing",
    ];
    return processingStatuses.includes(video.status);
}
