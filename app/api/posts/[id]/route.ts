import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPostById, deletePost, updatePostAnalytics } from "@/lib/db/posts";
import { getVideoById } from "@/lib/db/videos";
import { tiktokAPI } from "@/lib/social/tiktok";
import { facebookAPI } from "@/lib/social/facebook";
import { youtubeAPI } from "@/lib/social/youtube";

/**
 * GET /api/posts/[id]
 * Get post details with analytics
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get post
        const post = await getPostById(id, userId);

        if (!post) {
            return NextResponse.json(
                { error: "ไม่พบโพสต์", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // Get related video
        const video = await getVideoById(post.video_id, userId);

        // Optionally refresh analytics
        const { searchParams } = new URL(request.url);
        const refreshAnalytics = searchParams.get("refreshAnalytics") === "true";

        let freshAnalytics = null;
        if (refreshAnalytics && post.status === "posted" && post.post_id) {
            freshAnalytics = await refreshPostAnalytics(userId, post);
        }

        return NextResponse.json({
            success: true,
            post: {
                ...post,
                ...(freshAnalytics && {
                    views: freshAnalytics.views,
                    likes: freshAnalytics.likes,
                    comments: freshAnalytics.comments,
                    shares: freshAnalytics.shares,
                }),
            },
            video: video
                ? {
                    id: video.id,
                    title: video.title,
                    thumbnailUrl: video.thumbnail_url,
                    duration: video.duration,
                }
                : null,
        });
    } catch (error) {
        console.error("Get post error:", error);

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
 * DELETE /api/posts/[id]
 * Delete a post
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Verify post exists
        const post = await getPostById(id, userId);

        if (!post) {
            return NextResponse.json(
                { error: "ไม่พบโพสต์", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // Delete post
        await deletePost(id, userId);

        return NextResponse.json({
            success: true,
            message: "ลบโพสต์สำเร็จ",
            postId: id,
        });
    } catch (error) {
        console.error("Delete post error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการลบโพสต์",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/posts/[id]
 * Refresh analytics for a post
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get post
        const post = await getPostById(id, userId);

        if (!post) {
            return NextResponse.json(
                { error: "ไม่พบโพสต์", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        if (post.status !== "posted" || !post.post_id) {
            return NextResponse.json(
                { error: "ยังไม่ได้โพสต์", code: "NOT_POSTED" },
                { status: 400 }
            );
        }

        // Refresh analytics
        const analytics = await refreshPostAnalytics(userId, post);

        if (!analytics) {
            return NextResponse.json(
                { error: "ไม่สามารถดึง analytics ได้", code: "ANALYTICS_FAILED" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "อัปเดต analytics สำเร็จ",
            analytics,
        });
    } catch (error) {
        console.error("Refresh analytics error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาด",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * Refresh post analytics from platform
 */
async function refreshPostAnalytics(
    userId: string,
    post: Awaited<ReturnType<typeof getPostById>>
) {
    if (!post || !post.post_id) return null;

    try {
        let analytics = { views: 0, likes: 0, comments: 0, shares: 0 };

        switch (post.platform) {
            case "tiktok":
                const tiktokToken = await tiktokAPI.getToken(userId);
                if (tiktokToken) {
                    analytics = await tiktokAPI.getAnalytics(
                        tiktokToken.access_token,
                        post.post_id
                    );
                }
                break;

            case "facebook":
                const fbPages = await facebookAPI.getUserPages(userId);
                if (fbPages.length > 0) {
                    analytics = await facebookAPI.getAnalytics(
                        fbPages[0].access_token,
                        post.post_id
                    );
                }
                break;

            case "youtube":
                const ytToken = await youtubeAPI.getToken(userId);
                if (ytToken) {
                    analytics = await youtubeAPI.getAnalytics(ytToken, post.post_id);
                }
                break;
        }

        // Update in database
        await updatePostAnalytics(post.id, userId, analytics);

        return analytics;
    } catch (error) {
        console.error("Refresh analytics error:", error);
        return null;
    }
}
