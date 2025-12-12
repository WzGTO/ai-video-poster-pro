import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPosts, getPostStats, getTopPosts, getRecentPosts } from "@/lib/db/posts";
import type { Platform, PostStatus } from "@/types/database";

/**
 * GET /api/posts/list
 * Get list of posts with filters
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
        const status = searchParams.get("status") as PostStatus | null;
        const videoId = searchParams.get("videoId") || undefined;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const includeStats = searchParams.get("includeStats") === "true";
        const topOnly = searchParams.get("topOnly") === "true";
        const recentOnly = searchParams.get("recentOnly") === "true";

        // 3. Get top posts if requested
        if (topOnly) {
            const orderBy =
                (searchParams.get("orderBy") as "views" | "likes" | "shares") || "views";
            const topLimit = parseInt(searchParams.get("limit") || "5", 10);
            const posts = await getTopPosts(userId, topLimit, orderBy);

            return NextResponse.json({
                success: true,
                posts,
                total: posts.length,
            });
        }

        // 4. Get recent posts if requested
        if (recentOnly) {
            const recentLimit = parseInt(searchParams.get("limit") || "5", 10);
            const posts = await getRecentPosts(userId, recentLimit);

            return NextResponse.json({
                success: true,
                posts,
                total: posts.length,
            });
        }

        // 5. Build filters
        const filters: {
            platform?: Platform;
            status?: PostStatus;
            videoId?: string;
        } = {};

        if (platform) {
            filters.platform = platform;
        }

        if (status) {
            filters.status = status;
        }

        if (videoId) {
            filters.videoId = videoId;
        }

        // 6. Get posts with pagination
        const result = await getPosts(userId, filters, { page, limit });

        // 7. Get stats if requested
        let stats = null;
        if (includeStats) {
            stats = await getPostStats(userId);
        }

        // 8. Return response
        return NextResponse.json({
            success: true,
            posts: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.page < result.totalPages,
                hasPrev: result.page > 1,
            },
            ...(stats && { stats }),
        });
    } catch (error) {
        console.error("Get posts error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
