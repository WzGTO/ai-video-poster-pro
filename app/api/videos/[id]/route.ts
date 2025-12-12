import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideoById, deleteVideo, updateVideo } from "@/lib/db/videos";
import { getPostsByVideo } from "@/lib/db/posts";
import { getProductById } from "@/lib/db/products";
import { GoogleDriveManager } from "@/lib/google-drive";
import { removeJob } from "@/lib/video/types";

/**
 * GET /api/videos/[id]
 * ดึงข้อมูลวิดีโอ
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. ดึงข้อมูลวิดีโอ
        const video = await getVideoById(id, userId);

        if (!video) {
            return NextResponse.json(
                { error: "ไม่พบวิดีโอ", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // 3. ดึงข้อมูลเพิ่มเติม
        const [posts, product] = await Promise.all([
            getPostsByVideo(id, userId),
            video.product_id ? getProductById(video.product_id, userId) : null,
        ]);

        // 4. Return response
        return NextResponse.json({
            success: true,
            video: {
                ...video,
                product: product
                    ? {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.images[0],
                    }
                    : null,
            },
            posts: posts.map((post) => ({
                id: post.id,
                platform: post.platform,
                status: post.status,
                postUrl: post.post_url,
                postedAt: post.posted_at,
                analytics: {
                    views: post.views,
                    likes: post.likes,
                    shares: post.shares,
                },
            })),
            postCount: posts.length,
            platforms: [...new Set(posts.map((p) => p.platform))],
        });
    } catch (error) {
        console.error("Get video error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงข้อมูลวิดีโอ",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/videos/[id]
 * อัปเดตวิดีโอ
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. ตรวจสอบว่าวิดีโอมีอยู่
        const existingVideo = await getVideoById(id, userId);

        if (!existingVideo) {
            return NextResponse.json(
                { error: "ไม่พบวิดีโอ", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // 3. Parse request body
        const body = await request.json();
        const allowedFields = ["title", "script"];

        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "ไม่มีข้อมูลที่จะอัปเดต", code: "NO_UPDATES" },
                { status: 400 }
            );
        }

        // 4. อัปเดตวิดีโอ
        const updatedVideo = await updateVideo(id, userId, updates);

        return NextResponse.json({
            success: true,
            message: "อัปเดตวิดีโอสำเร็จ",
            video: updatedVideo,
        });
    } catch (error) {
        console.error("Update video error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการอัปเดตวิดีโอ",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/videos/[id]
 * ลบวิดีโอ (ลบจาก Drive และ database)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id || !session?.accessToken) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const accessToken = session.accessToken;

        // 2. ดึงข้อมูลวิดีโอ
        const video = await getVideoById(id, userId);

        if (!video) {
            return NextResponse.json(
                { error: "ไม่พบวิดีโอ", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // 3. ตรวจสอบว่าไม่ได้กำลังประมวลผล
        const processingStatuses = [
            "generating_script",
            "generating_video",
            "adding_audio",
            "adding_subtitles",
            "optimizing",
        ];

        if (processingStatuses.includes(video.status)) {
            return NextResponse.json(
                {
                    error: "ไม่สามารถลบวิดีโอที่กำลังประมวลผลได้",
                    code: "VIDEO_PROCESSING",
                },
                { status: 400 }
            );
        }

        // 4. ลบไฟล์จาก Google Drive
        const driveManager = new GoogleDriveManager(accessToken);
        const deletedFiles: string[] = [];
        const failedFiles: string[] = [];

        const fileIds = [
            video.original_file_id,
            video.optimized_file_id,
            video.thumbnail_file_id,
            video.audio_file_id,
        ].filter((id): id is string => !!id);

        for (const fileId of fileIds) {
            try {
                await driveManager.deleteFile(fileId);
                deletedFiles.push(fileId);
            } catch (error) {
                console.warn(`Failed to delete file ${fileId}:`, error);
                failedFiles.push(fileId);
            }
        }

        // 5. ลบ video record จาก database
        await deleteVideo(id, userId);

        // 6. Remove job from memory (if exists)
        removeJob(id);

        // 7. Return response
        return NextResponse.json({
            success: true,
            message: "ลบวิดีโอสำเร็จ",
            videoId: id,
            deletedFiles: deletedFiles.length,
            failedFiles: failedFiles.length,
        });
    } catch (error) {
        console.error("Delete video error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการลบวิดีโอ",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
