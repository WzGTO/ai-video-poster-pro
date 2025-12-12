import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPosts, deletePost } from "@/lib/db/posts";
import { supabase } from "@/lib/supabase";
import type { Platform, PostStatus } from "@/types/database";

/**
 * GET /api/posts/schedule
 * Get scheduled posts
 */
export async function GET(request: NextRequest) {
    try {
        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. Parse query params
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get("platform") as Platform | null;
        const upcoming = searchParams.get("upcoming") === "true";
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);

        // 3. Query scheduled posts
        let query = supabase
            .from("posts")
            .select(
                `
        *,
        videos:videos(id, title, thumbnail_url, public_url, duration)
      `,
                { count: "exact" }
            )
            .eq("user_id", userId)
            .eq("status", "scheduled")
            .order("scheduled_at", { ascending: true });

        if (platform) {
            query = query.eq("platform", platform);
        }

        if (upcoming) {
            query = query.gte("scheduled_at", new Date().toISOString());
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to get scheduled posts: ${error.message}`);
        }

        // 4. Format response
        const posts = (data || []).map((post) => ({
            id: post.id,
            platform: post.platform,
            caption: post.caption,
            hashtags: post.hashtags,
            scheduledAt: post.scheduled_at,
            video: post.videos
                ? {
                    id: post.videos.id,
                    title: post.videos.title,
                    thumbnailUrl: post.videos.thumbnail_url,
                    duration: post.videos.duration,
                }
                : null,
            createdAt: post.created_at,
        }));

        const total = count || 0;

        return NextResponse.json({
            success: true,
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
            summary: {
                total,
                byPlatform: {
                    tiktok: posts.filter((p) => p.platform === "tiktok").length,
                    facebook: posts.filter((p) => p.platform === "facebook").length,
                    youtube: posts.filter((p) => p.platform === "youtube").length,
                },
            },
        });
    } catch (error) {
        console.error("Get scheduled posts error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/posts/schedule
 * Cancel a scheduled post
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get post ID from query
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get("postId");

        if (!postId) {
            return NextResponse.json(
                { error: "postId is required", code: "MISSING_POST_ID" },
                { status: 400 }
            );
        }

        // Verify post exists and is scheduled
        const { data: post, error: fetchError } = await supabase
            .from("posts")
            .select("id, status")
            .eq("id", postId)
            .eq("user_id", userId)
            .single();

        if (fetchError || !post) {
            return NextResponse.json(
                { error: "ไม่พบโพสต์", code: "POST_NOT_FOUND" },
                { status: 404 }
            );
        }

        if (post.status !== "scheduled") {
            return NextResponse.json(
                { error: "ไม่สามารถยกเลิกโพสต์ที่ไม่ได้ตั้งเวลาได้", code: "NOT_SCHEDULED" },
                { status: 400 }
            );
        }

        // Delete the post
        await deletePost(postId, userId);

        return NextResponse.json({
            success: true,
            message: "ยกเลิกโพสต์สำเร็จ",
            postId,
        });
    } catch (error) {
        console.error("Cancel scheduled post error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการยกเลิกโพสต์",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/posts/schedule
 * Reschedule a post
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        const body = await request.json();
        const { postId, scheduledAt, caption, hashtags } = body;

        if (!postId) {
            return NextResponse.json(
                { error: "postId is required", code: "MISSING_POST_ID" },
                { status: 400 }
            );
        }

        // Verify post exists and is scheduled
        const { data: post, error: fetchError } = await supabase
            .from("posts")
            .select("id, status")
            .eq("id", postId)
            .eq("user_id", userId)
            .single();

        if (fetchError || !post) {
            return NextResponse.json(
                { error: "ไม่พบโพสต์", code: "POST_NOT_FOUND" },
                { status: 404 }
            );
        }

        if (post.status !== "scheduled") {
            return NextResponse.json(
                { error: "ไม่สามารถแก้ไขโพสต์ที่ไม่ได้ตั้งเวลาได้", code: "NOT_SCHEDULED" },
                { status: 400 }
            );
        }

        // Build updates
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (scheduledAt) {
            const newScheduledAt = new Date(scheduledAt);
            if (newScheduledAt <= new Date()) {
                return NextResponse.json(
                    { error: "เวลาที่กำหนดต้องอยู่ในอนาคต", code: "INVALID_SCHEDULE_TIME" },
                    { status: 400 }
                );
            }
            updates.scheduled_at = scheduledAt;
        }

        if (caption !== undefined) {
            updates.caption = caption;
        }

        if (hashtags !== undefined) {
            updates.hashtags = hashtags;
        }

        // Update post
        const { data: updatedPost, error: updateError } = await supabase
            .from("posts")
            .update(updates)
            .eq("id", postId)
            .eq("user_id", userId)
            .select()
            .single();

        if (updateError) {
            throw new Error(`Failed to update post: ${updateError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: "อัปเดตโพสต์สำเร็จ",
            post: updatedPost,
        });
    } catch (error) {
        console.error("Reschedule post error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการอัปเดตโพสต์",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
