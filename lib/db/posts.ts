import { supabase } from "@/lib/supabase";
import type {
    Post,
    PostFilters,
    PostData,
    PostStatus,
    PostAnalytics,
    Platform,
    PaginationParams,
    PaginatedResult,
} from "@/types/database";

// ===== Post Functions =====

/**
 * สร้าง post record ใหม่
 */
export async function createPost(
    userId: string,
    postData: PostData
): Promise<Post> {
    const { data, error } = await supabase
        .from("posts")
        .insert({
            user_id: userId,
            video_id: postData.video_id,
            platform: postData.platform,
            caption: postData.caption || null,
            hashtags: postData.hashtags || [],
            scheduled_at: postData.scheduled_at || null,
            status: postData.scheduled_at ? "scheduled" : "draft",
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            clicks: 0,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create post: ${error.message}`);
    }

    return data as Post;
}

/**
 * ดึง posts ทั้งหมดของ user พร้อม filters และ pagination
 */
export async function getPosts(
    userId: string,
    filters?: PostFilters,
    pagination?: PaginationParams
): Promise<PaginatedResult<Post>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
        .from("posts")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

    // Apply filters
    if (filters?.platform) {
        query = query.eq("platform", filters.platform);
    }

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    if (filters?.videoId) {
        query = query.eq("video_id", filters.videoId);
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
        throw new Error(`Failed to get posts: ${error.message}`);
    }

    const total = count || 0;

    return {
        data: (data as Post[]) || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * ดึง post ตาม ID
 */
export async function getPostById(
    postId: string,
    userId: string
): Promise<Post | null> {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .eq("user_id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        throw new Error(`Failed to get post: ${error.message}`);
    }

    return data as Post;
}

/**
 * ดึง posts ของ video
 */
export async function getPostsByVideo(
    videoId: string,
    userId: string
): Promise<Post[]> {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("video_id", videoId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Failed to get posts: ${error.message}`);
    }

    return (data as Post[]) || [];
}

/**
 * อัปเดตสถานะ post
 */
export async function updatePostStatus(
    postId: string,
    userId: string,
    status: PostStatus,
    updates?: {
        post_id?: string;
        post_url?: string;
        posted_at?: string;
        error_message?: string;
    }
): Promise<Post> {
    const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (updates?.post_id) {
        updateData.post_id = updates.post_id;
    }

    if (updates?.post_url) {
        updateData.post_url = updates.post_url;
    }

    if (updates?.posted_at) {
        updateData.posted_at = updates.posted_at;
    }

    if (updates?.error_message !== undefined) {
        updateData.error_message = updates.error_message;
    }

    // Clear error when status is not failed
    if (status !== "failed") {
        updateData.error_message = null;
    }

    const { data, error } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", postId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update post status: ${error.message}`);
    }

    return data as Post;
}

/**
 * อัปเดต analytics ของ post
 */
export async function updatePostAnalytics(
    postId: string,
    userId: string,
    analytics: PostAnalytics
): Promise<Post> {
    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (analytics.views !== undefined) {
        updateData.views = analytics.views;
    }
    if (analytics.likes !== undefined) {
        updateData.likes = analytics.likes;
    }
    if (analytics.comments !== undefined) {
        updateData.comments = analytics.comments;
    }
    if (analytics.shares !== undefined) {
        updateData.shares = analytics.shares;
    }
    if (analytics.clicks !== undefined) {
        updateData.clicks = analytics.clicks;
    }

    const { data, error } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", postId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update analytics: ${error.message}`);
    }

    return data as Post;
}

/**
 * อัปเดต post data
 */
export async function updatePost(
    postId: string,
    userId: string,
    updates: Partial<PostData>
): Promise<Post> {
    const { data, error } = await supabase
        .from("posts")
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update post: ${error.message}`);
    }

    return data as Post;
}

/**
 * ลบ post record
 */
export async function deletePost(
    postId: string,
    userId: string
): Promise<boolean> {
    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
    }

    return true;
}

/**
 * ดึงสถิติ posts ตาม platform
 */
export async function getPostStats(userId: string): Promise<{
    total: number;
    posted: number;
    scheduled: number;
    failed: number;
    byPlatform: Record<Platform, number>;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
}> {
    const { data, error } = await supabase
        .from("posts")
        .select("status, platform, views, likes, shares")
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to get stats: ${error.message}`);
    }

    const posts = data || [];

    const byPlatform: Record<Platform, number> = {
        tiktok: 0,
        facebook: 0,
        youtube: 0,
        instagram: 0,
    };

    posts.forEach((p) => {
        if (p.platform in byPlatform) {
            byPlatform[p.platform as Platform]++;
        }
    });

    return {
        total: posts.length,
        posted: posts.filter((p) => p.status === "posted").length,
        scheduled: posts.filter((p) => p.status === "scheduled").length,
        failed: posts.filter((p) => p.status === "failed").length,
        byPlatform,
        totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
        totalLikes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
        totalShares: posts.reduce((sum, p) => sum + (p.shares || 0), 0),
    };
}

/**
 * ดึง scheduled posts ที่ถึงเวลาโพสต์
 */
export async function getScheduledPostsDue(): Promise<Post[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", now)
        .order("scheduled_at", { ascending: true });

    if (error) {
        throw new Error(`Failed to get scheduled posts: ${error.message}`);
    }

    return (data as Post[]) || [];
}

/**
 * ดึง top performing posts
 */
export async function getTopPosts(
    userId: string,
    limit: number = 5,
    orderBy: "views" | "likes" | "shares" = "views"
): Promise<Post[]> {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "posted")
        .order(orderBy, { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Failed to get top posts: ${error.message}`);
    }

    return (data as Post[]) || [];
}

/**
 * ดึง recent posts
 */
export async function getRecentPosts(
    userId: string,
    limit: number = 5
): Promise<Post[]> {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Failed to get recent posts: ${error.message}`);
    }

    return (data as Post[]) || [];
}
