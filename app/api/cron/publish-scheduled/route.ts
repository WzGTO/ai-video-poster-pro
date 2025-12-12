import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { tiktokAPI } from "@/lib/social/tiktok";
import { facebookAPI } from "@/lib/social/facebook";
import { youtubeAPI } from "@/lib/social/youtube";
import type { Platform } from "@/types/database";

// ===== Types =====

interface ScheduledPost {
    id: string;
    user_id: string;
    video_id: string;
    platform: Platform;
    caption: string;
    hashtags: string[];
    scheduled_at: string;
    videos: {
        public_url: string | null;
        title: string;
    } | null;
}

interface PublishResult {
    postId: string;
    platform: Platform;
    success: boolean;
    postUrl?: string;
    error?: string;
}

// ===== Route Handler =====

/**
 * GET /api/cron/publish-scheduled
 * Cron job to publish scheduled posts
 * Should be called every 5 minutes
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Verify cron secret (for security)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        console.log("Starting scheduled post publishing cron job...");

        // 2. Get posts that are due for publishing
        const now = new Date().toISOString();

        const { data: scheduledPosts, error: fetchError } = await supabase
            .from("posts")
            .select(
                `
        id,
        user_id,
        video_id,
        platform,
        caption,
        hashtags,
        scheduled_at,
        videos:videos(public_url, title)
      `
            )
            .eq("status", "scheduled")
            .lte("scheduled_at", now)
            .order("scheduled_at", { ascending: true })
            .limit(50); // Process up to 50 posts per run

        if (fetchError) {
            throw new Error(`Failed to fetch scheduled posts: ${fetchError.message}`);
        }

        if (!scheduledPosts || scheduledPosts.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No scheduled posts to publish",
                processed: 0,
            });
        }

        console.log(`Found ${scheduledPosts.length} posts to publish`);

        // 3. Process each post
        const results: PublishResult[] = [];

        for (const post of scheduledPosts as unknown as ScheduledPost[]) {
            const result = await publishPost(post);
            results.push(result);

            // Small delay between posts to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // 4. Summary
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;

        console.log(`Cron job completed: ${successCount} success, ${failedCount} failed`);

        return NextResponse.json({
            success: true,
            message: `Published ${successCount} posts, ${failedCount} failed`,
            processed: results.length,
            results,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Cron job error:", error);

        return NextResponse.json(
            {
                error: "Cron job failed",
                code: "CRON_ERROR",
                details: error instanceof Error ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// ===== Helper Functions =====

/**
 * Publish a single scheduled post
 */
async function publishPost(post: ScheduledPost): Promise<PublishResult> {
    const { id, user_id, platform, caption, hashtags, videos } = post;

    try {
        // Update status to "posting"
        await supabase
            .from("posts")
            .update({ status: "posting", updated_at: new Date().toISOString() })
            .eq("id", id);

        if (!videos?.public_url) {
            throw new Error("Video URL not found");
        }

        let postResult: { postId: string; postUrl: string };

        // Post to platform
        switch (platform) {
            case "tiktok":
                const tiktokToken = await tiktokAPI.getToken(user_id);
                if (!tiktokToken) {
                    throw new Error("TikTok token not found");
                }
                const tiktokResult = await tiktokAPI.postVideo(tiktokToken.access_token, {
                    videoUrl: videos.public_url,
                    caption,
                    hashtags,
                });
                postResult = { postId: tiktokResult.postId, postUrl: tiktokResult.postUrl };
                break;

            case "facebook":
                const fbPages = await facebookAPI.getUserPages(user_id);
                if (fbPages.length === 0) {
                    throw new Error("No Facebook pages found");
                }
                const page = fbPages[0];
                const fbResult = await facebookAPI.postVideo({
                    videoUrl: videos.public_url,
                    caption,
                    pageId: page.id,
                    pageAccessToken: page.access_token,
                });
                postResult = { postId: fbResult.postId, postUrl: fbResult.postUrl };
                break;

            case "youtube":
                const ytToken = await youtubeAPI.getToken(user_id);
                if (!ytToken) {
                    throw new Error("YouTube token not found");
                }
                const ytResult = await youtubeAPI.uploadShort(ytToken, {
                    videoUrl: videos.public_url,
                    title: caption.slice(0, 100),
                    description: caption,
                    tags: hashtags,
                });
                postResult = { postId: ytResult.videoId, postUrl: ytResult.videoUrl };
                break;

            default:
                throw new Error(`Platform ${platform} not supported`);
        }

        // Update post with success
        await supabase
            .from("posts")
            .update({
                status: "posted",
                post_id: postResult.postId,
                post_url: postResult.postUrl,
                posted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        console.log(`✅ Published post ${id} to ${platform}`);

        return {
            postId: id,
            platform,
            success: true,
            postUrl: postResult.postUrl,
        };
    } catch (error) {
        console.error(`❌ Failed to publish post ${id} to ${platform}:`, error);

        // Update post with failure
        await supabase
            .from("posts")
            .update({
                status: "failed",
                error_message: error instanceof Error ? error.message : "Unknown error",
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        return {
            postId: id,
            platform,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ===== Config =====

// Allow longer timeout for cron jobs
export const maxDuration = 300; // 5 minutes

// Disable body parsing as we don't need it
export const dynamic = "force-dynamic";
