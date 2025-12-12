import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleDriveManager, GoogleDriveError } from "@/lib/google-drive";
import { getUserById, getUserVideos, getUserProducts } from "@/lib/supabase";

// ===== Helper Functions =====

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ===== Route Handler =====

/**
 * GET /api/drive/storage
 * ดึงข้อมูล storage quota และ usage breakdown
 */
export async function GET() {
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

        // 2. ดึง user จาก Supabase
        const user = await getUserById(userId);

        if (!user?.google_drive_folders) {
            return NextResponse.json(
                {
                    error: "กรุณาสร้างโฟลเดอร์ก่อน (/api/drive/init)",
                    code: "FOLDERS_NOT_INITIALIZED",
                },
                { status: 400 }
            );
        }

        // 3. ดึง storage quota จาก Google Drive
        const manager = new GoogleDriveManager(accessToken);
        const quota = await manager.getStorageInfo();

        // 4. ดึงจำนวน files จาก Supabase
        const [videos, products] = await Promise.all([
            getUserVideos(userId),
            getUserProducts(userId),
        ]);

        // 5. คำนวณ usage per folder (query files from Drive)
        const folders = user.google_drive_folders;

        let videosUsage = 0;
        let productsUsage = 0;
        let audioUsage = 0;

        try {
            // ดึงข้อมูล files ในแต่ละ folder
            const [videoFiles, productFiles, audioFiles] = await Promise.all([
                manager.listFiles(folders.videos.root),
                manager.listFiles(folders.products),
                manager.listFiles(folders.audio),
            ]);

            videosUsage = videoFiles.reduce((sum, f) => sum + f.size, 0);
            productsUsage = productFiles.reduce((sum, f) => sum + f.size, 0);
            audioUsage = audioFiles.reduce((sum, f) => sum + f.size, 0);
        } catch (e) {
            // ถ้าดึงไม่ได้ก็ใช้ค่า 0
            console.warn("Could not fetch folder usage:", e);
        }

        const appUsage = videosUsage + productsUsage + audioUsage;

        // 6. Return response
        return NextResponse.json({
            success: true,
            total: {
                bytes: quota.limit,
                formatted: formatBytes(quota.limit),
            },
            used: {
                bytes: quota.usage,
                formatted: formatBytes(quota.usage),
            },
            available: {
                bytes: quota.available,
                formatted: formatBytes(quota.available),
            },
            percentUsed: quota.percentUsed,
            breakdown: {
                app: {
                    bytes: appUsage,
                    formatted: formatBytes(appUsage),
                    percentage: quota.limit > 0 ? (appUsage / quota.limit) * 100 : 0,
                },
                videos: {
                    bytes: videosUsage,
                    formatted: formatBytes(videosUsage),
                    count: videos.length,
                },
                products: {
                    bytes: productsUsage,
                    formatted: formatBytes(productsUsage),
                    count: products.length,
                },
                audio: {
                    bytes: audioUsage,
                    formatted: formatBytes(audioUsage),
                },
                other: {
                    bytes: quota.usage - appUsage,
                    formatted: formatBytes(Math.max(0, quota.usage - appUsage)),
                    description: "ไฟล์อื่นๆ ใน Google Drive ของคุณ",
                },
            },
            stats: {
                totalVideos: videos.length,
                totalProducts: products.length,
                completedVideos: videos.filter((v) => v.status === "completed").length,
                processingVideos: videos.filter((v) => v.status === "processing").length,
            },
        });
    } catch (error) {
        console.error("Storage info error:", error);

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
                error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
