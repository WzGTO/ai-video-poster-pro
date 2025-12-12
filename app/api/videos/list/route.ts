import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideos, getVideoStats, getRecentVideos } from "@/lib/db/videos";
import type { VideoStatus } from "@/types/database";

/**
 * GET /api/videos/list
 * ดึงรายการวิดีโอ
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
        const status = searchParams.get("status") as VideoStatus | null;
        const productId = searchParams.get("productId") || undefined;
        const search = searchParams.get("search") || undefined;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const includeStats = searchParams.get("includeStats") === "true";
        const recentOnly = searchParams.get("recentOnly") === "true";

        // 3. Get recent videos if requested
        if (recentOnly) {
            const recentLimit = parseInt(searchParams.get("limit") || "5", 10);
            const videos = await getRecentVideos(userId, recentLimit);

            return NextResponse.json({
                success: true,
                videos,
                total: videos.length,
            });
        }

        // 4. Build filters
        const filters: {
            status?: VideoStatus;
            productId?: string;
            search?: string;
        } = {};

        if (status) {
            filters.status = status;
        }

        if (productId) {
            filters.productId = productId;
        }

        if (search) {
            filters.search = search;
        }

        // 5. Get videos with pagination
        const result = await getVideos(userId, filters, { page, limit });

        // 6. Get stats if requested
        let stats = null;
        if (includeStats) {
            stats = await getVideoStats(userId);
        }

        // 7. Return response
        return NextResponse.json({
            success: true,
            videos: result.data,
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
        console.error("Get videos error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงข้อมูลวิดีโอ",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
