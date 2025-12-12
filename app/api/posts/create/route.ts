import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { TikTokAPI } from "@/lib/social/tiktok";
import { FacebookAPI } from "@/lib/social/facebook";
import { YouTubeAPI } from "@/lib/social/youtube";
import { logger } from "@/lib/logger";

// Supabase client with service role
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===== Types =====

interface CreatePostBody {
    videoId: string;
    platforms: string[];
    captions: Record<string, string>;
    hashtags: Record<string, string[]>;
    tiktokProductId?: string;
    facebook?: {
        targetType: "page" | "profile";
        targetId?: string;
        videoType: "reel" | "regular";
    };
    youtube?: {
        title: string;
        description: string;
        tags: string[];
        videoType: "short" | "regular";
    };
    scheduleAt?: string | null; // ISO datetime
}

interface PostResult {
    platform: string;
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
    data?: Record<string, unknown>;
}

// ===== Route Handler =====

/**
 * POST /api/posts/create
 * Create posts to multiple social platforms
 */
export async function POST(request: NextRequest) {
    try {
        // 1. ตรวจสอบ authentication
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. Parse request body
        const body: CreatePostBody = await request.json();

        // 3. Validate input
        if (!body.videoId) {
            return NextResponse.json(
                { error: "videoId is required", code: "MISSING_VIDEO_ID" },
                { status: 400 }
            );
        }

        if (!body.platforms || body.platforms.length === 0) {
            return NextResponse.json(
                { error: "platforms is required", code: "MISSING_PLATFORMS" },
                { status: 400 }
            );
        }

        const validPlatforms = ["tiktok", "facebook", "youtube", "instagram"];
        for (const platform of body.platforms) {
            if (!validPlatforms.includes(platform)) {
                return NextResponse.json(
                    { error: `Invalid platform: ${platform}`, code: "INVALID_PLATFORM" },
                    { status: 400 }
                );
            }
        }

        // 4. ดึงข้อมูล video
        const { data: video, error: videoError } = await supabase
            .from("videos")
            .select("*, product:products(*)")
            .eq("id", body.videoId)
            .eq("user_id", userId)
            .single();

        if (videoError || !video) {
            return NextResponse.json(
                { error: "ไม่พบวิดีโอ", code: "VIDEO_NOT_FOUND" },
                { status: 404 }
            );
        }

        if (video.status !== "completed") {
            return NextResponse.json(
                { error: "วิดีโอยังไม่พร้อมโพสต์", code: "VIDEO_NOT_READY" },
                { status: 400 }
            );
        }

        // 5. ดึงข้อมูล user
        const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        // 6. ถ้ามี scheduleAt: สร้าง scheduled posts
        if (body.scheduleAt) {
            const scheduledAt = new Date(body.scheduleAt);

            if (scheduledAt <= new Date()) {
                return NextResponse.json(
                    { error: "เวลาที่กำหนดต้องอยู่ในอนาคต", code: "INVALID_SCHEDULE_TIME" },
                    { status: 400 }
                );
            }

            const scheduledPosts = await createScheduledPosts(userId, video, body, scheduledAt);

            return NextResponse.json({
                success: true,
                scheduled: true,
                message: `กำหนดโพสต์ ${scheduledPosts.length} รายการ`,
                scheduledAt: body.scheduleAt,
                posts: scheduledPosts.map((p) => ({
                    id: p.id,
                    platform: p.platform,
                    scheduledAt: p.scheduled_at,
                })),
            });
        }

        // 7. โพสต์ทันที
        const results = await postToAllPlatforms(userId, user, video, body);

        // 8. สรุปผล
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;

        return NextResponse.json({
            success: failedCount === 0,
            message:
                failedCount === 0
                    ? `โพสต์สำเร็จ ${successCount} รายการ`
                    : `โพสต์สำเร็จ ${successCount} รายการ, ล้มเหลว ${failedCount} รายการ`,
            results,
        });
    } catch (error) {
        logger.error("Create post error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการโพสต์",
                code: "UNKNOWN_ERROR",
                details: error instanceof Error ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// ===== Helper Functions =====

/**
 * Create scheduled posts in database
 */
async function createScheduledPosts(
    userId: string,
    video: Record<string, unknown>,
    body: CreatePostBody,
    scheduledAt: Date
) {
    const posts = [];

    for (const platform of body.platforms) {
        const caption = body.captions[platform] || (video.title as string) || "";
        const hashtags = body.hashtags[platform] || [];

        // Build post data
        const postData: Record<string, unknown> = {
            user_id: userId,
            video_id: video.id,
            platform,
            caption,
            hashtags,
            scheduled_at: scheduledAt.toISOString(),
            status: "scheduled",
        };

        // Add platform-specific fields
        if (platform === "tiktok" && body.tiktokProductId) {
            postData.tiktok_product_id = body.tiktokProductId;
        } else if (platform === "facebook" && body.facebook) {
            postData.target_type = body.facebook.targetType;
            postData.target_id = body.facebook.targetId;
            postData.video_type = body.facebook.videoType;
        } else if (platform === "youtube" && body.youtube) {
            postData.video_type = body.youtube.videoType;
            postData.youtube_title = body.youtube.title;
            postData.youtube_description = body.youtube.description;
            postData.youtube_tags = body.youtube.tags;
        }

        const { data, error } = await supabase
            .from("posts")
            .insert(postData)
            .select()
            .single();

        if (!error && data) {
            posts.push(data);
        } else {
            logger.error(`Failed to create scheduled post for ${platform}`, error);
        }
    }

    return posts;
}

/**
 * Post to all platforms immediately
 */
async function postToAllPlatforms(
    userId: string,
    user: Record<string, unknown> | null,
    video: Record<string, unknown>,
    body: CreatePostBody
): Promise<PostResult[]> {
    const results: PostResult[] = [];

    for (const platform of body.platforms) {
        const caption = body.captions[platform] || (video.title as string) || "";
        const hashtags = body.hashtags[platform] || [];

        try {
            let result: { postId?: string; postUrl?: string; success: boolean };

            switch (platform) {
                case "tiktok":
                    result = await postToTikTok(userId, video, caption, hashtags, body.tiktokProductId);
                    break;

                case "facebook":
                    result = await postToFacebook(userId, video, caption, body.facebook);
                    break;

                case "youtube":
                    result = await postToYouTube(userId, video, body.youtube);
                    break;

                default:
                    throw new Error(`Platform ${platform} not supported`);
            }

            // Build post record
            const postData: Record<string, unknown> = {
                user_id: userId,
                video_id: video.id,
                platform,
                post_id: result.postId,
                post_url: result.postUrl,
                caption,
                hashtags,
                posted_at: new Date().toISOString(),
                status: "published",
            };

            // Add platform-specific fields
            if (platform === "facebook" && body.facebook) {
                postData.target_type = body.facebook.targetType;
                postData.target_id = body.facebook.targetId;
                postData.video_type = body.facebook.videoType;
            } else if (platform === "youtube" && body.youtube) {
                postData.video_type = body.youtube.videoType;
                postData.youtube_title = body.youtube.title;
                postData.youtube_description = body.youtube.description;
                postData.youtube_tags = body.youtube.tags;
            }

            const { data } = await supabase.from("posts").insert(postData).select().single();

            results.push({
                platform,
                success: true,
                postId: result.postId,
                postUrl: result.postUrl,
                data: data ?? undefined,
            });
        } catch (error) {
            logger.error(`Failed to post to ${platform}`, error);

            // Record failed post
            await supabase.from("posts").insert({
                user_id: userId,
                video_id: video.id,
                platform,
                caption,
                hashtags,
                status: "failed",
                error_message: error instanceof Error ? error.message : "Unknown error",
            });

            results.push({
                platform,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return results;
}

/**
 * Post to TikTok
 */
async function postToTikTok(
    userId: string,
    video: Record<string, unknown>,
    caption: string,
    hashtags: string[],
    productId?: string
): Promise<{ postId: string; postUrl: string; success: boolean }> {
    // Get TikTok token
    const { data: tokenData } = await supabase
        .from("user_tokens")
        .select("access_token, refresh_token")
        .eq("user_id", userId)
        .eq("provider", "tiktok")
        .single();

    if (!tokenData?.access_token) {
        throw new Error("TikTok not connected");
    }

    const tiktokAPI = new TikTokAPI();
    const result = await tiktokAPI.postVideo(tokenData.access_token, {
        videoUrl: video.public_url as string,
        caption,
        hashtags,
        productId,
    });

    return {
        postId: result.postId,
        postUrl: result.postUrl,
        success: true,
    };
}

/**
 * Post to Facebook
 */
async function postToFacebook(
    userId: string,
    video: Record<string, unknown>,
    caption: string,
    facebookOptions?: CreatePostBody["facebook"]
): Promise<{ postId?: string; postUrl?: string; success: boolean }> {
    // Get Facebook token
    const { data: tokenData } = await supabase
        .from("user_tokens")
        .select("access_token")
        .eq("user_id", userId)
        .eq("provider", "facebook")
        .single();

    if (!tokenData?.access_token) {
        throw new Error("Facebook not connected");
    }

    const fbAPI = new FacebookAPI(tokenData.access_token);

    // If posting to page, get page token
    let pageAccessToken: string | undefined;
    if (facebookOptions?.targetType === "page" && facebookOptions.targetId) {
        const { data: pageData } = await supabase
            .from("user_pages")
            .select("access_token")
            .eq("user_id", userId)
            .eq("page_id", facebookOptions.targetId)
            .single();

        pageAccessToken = pageData?.access_token;
    }

    const result = await fbAPI.postVideo({
        videoUrl: video.public_url as string,
        caption,
        targetType: facebookOptions?.targetType || "page",
        targetId: facebookOptions?.targetId,
        pageAccessToken,
        videoType: facebookOptions?.videoType || "reel",
    });

    return {
        postId: result.postId,
        postUrl: result.postUrl,
        success: result.success,
    };
}

/**
 * Post to YouTube
 */
async function postToYouTube(
    userId: string,
    video: Record<string, unknown>,
    youtubeOptions?: CreatePostBody["youtube"]
): Promise<{ postId?: string; postUrl?: string; success: boolean }> {
    // Get YouTube token
    const { data: tokenData } = await supabase
        .from("user_tokens")
        .select("access_token, refresh_token")
        .eq("user_id", userId)
        .eq("provider", "youtube")
        .single();

    if (!tokenData?.access_token) {
        throw new Error("YouTube not connected");
    }

    const ytAPI = new YouTubeAPI(tokenData.access_token, tokenData.refresh_token);

    const title = youtubeOptions?.title || (video.title as string) || "Video";
    const description = youtubeOptions?.description || "";
    const tags = youtubeOptions?.tags || [];
    const videoType = youtubeOptions?.videoType || "short";

    const result = await ytAPI.uploadVideo({
        videoUrl: video.public_url as string,
        title,
        description,
        tags,
        videoType,
    });

    return {
        postId: result.postId,
        postUrl: result.postUrl,
        success: result.success,
    };
}
