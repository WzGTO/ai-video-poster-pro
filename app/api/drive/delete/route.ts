import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    GoogleDriveManager,
    GoogleDriveError,
    FileNotFoundError,
} from "@/lib/google-drive";
import { deleteVideoRecord, supabase } from "@/lib/supabase";

// ===== Types =====

interface DeleteRequestBody {
    fileId: string;
    videoId?: string;
    deleteRelated?: boolean; // ลบไฟล์ที่เกี่ยวข้องด้วย (thumbnail, audio, etc.)
}

// ===== Route Handler =====

/**
 * DELETE /api/drive/delete
 * ลบไฟล์จาก Google Drive และ Supabase
 */
export async function DELETE(request: NextRequest) {
    try {
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

        // 2. Parse request body
        const body: DeleteRequestBody = await request.json();
        const { fileId, videoId, deleteRelated = false } = body;

        if (!fileId) {
            return NextResponse.json(
                { error: "ต้องระบุ fileId", code: "MISSING_FILE_ID" },
                { status: 400 }
            );
        }

        // 3. ถ้ามี videoId: ตรวจสอบว่าเป็นของ user นี้
        if (videoId) {
            const { data: video, error } = await supabase
                .from("videos")
                .select("*")
                .eq("id", videoId)
                .eq("user_id", userId)
                .single();

            if (error || !video) {
                return NextResponse.json(
                    { error: "ไม่พบวิดีโอ หรือไม่มีสิทธิ์ลบ", code: "VIDEO_NOT_FOUND" },
                    { status: 404 }
                );
            }

            // ถ้า deleteRelated = true: ลบไฟล์ที่เกี่ยวข้องด้วย
            if (deleteRelated) {
                const manager = new GoogleDriveManager(accessToken);
                const filesToDelete: string[] = [];

                if (video.original_file_id) filesToDelete.push(video.original_file_id);
                if (video.optimized_file_id) filesToDelete.push(video.optimized_file_id);
                if (video.thumbnail_file_id) filesToDelete.push(video.thumbnail_file_id);
                if (video.audio_file_id) filesToDelete.push(video.audio_file_id);

                // ลบทุกไฟล์ที่เกี่ยวข้อง
                const deletePromises = filesToDelete.map(async (fid) => {
                    try {
                        await manager.deleteFile(fid);
                        return { fileId: fid, success: true };
                    } catch (e) {
                        // ถ้าไฟล์ไม่เจอก็ข้ามไป
                        return {
                            fileId: fid,
                            success: false,
                            error: e instanceof Error ? e.message : "Unknown error",
                        };
                    }
                });

                const deleteResults = await Promise.all(deletePromises);

                // ลบ record จาก Supabase
                await deleteVideoRecord(videoId);

                return NextResponse.json({
                    success: true,
                    message: "ลบวิดีโอและไฟล์ที่เกี่ยวข้องสำเร็จ",
                    videoId,
                    deletedFiles: deleteResults,
                });
            }
        }

        // 4. ลบไฟล์เดี่ยวจาก Google Drive
        const manager = new GoogleDriveManager(accessToken);

        try {
            await manager.deleteFile(fileId);
        } catch (error) {
            if (error instanceof FileNotFoundError) {
                // ไฟล์ถูกลบไปแล้ว - ถือว่าสำเร็จ
                console.log(`File ${fileId} already deleted`);
            } else {
                throw error;
            }
        }

        // 5. ถ้ามี videoId: ลบ record จาก Supabase
        if (videoId) {
            await deleteVideoRecord(videoId);
        }

        // 6. Return success
        return NextResponse.json({
            success: true,
            message: "ลบไฟล์สำเร็จ",
            fileId,
            videoId: videoId || null,
        });
    } catch (error) {
        console.error("Delete error:", error);

        if (error instanceof FileNotFoundError) {
            return NextResponse.json(
                {
                    error: "ไม่พบไฟล์",
                    code: "FILE_NOT_FOUND",
                },
                { status: 404 }
            );
        }

        if (error instanceof GoogleDriveError) {
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการลบไฟล์",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/drive/delete (alternative for clients that don't support DELETE)
 */
export async function POST(request: NextRequest) {
    return DELETE(request);
}
