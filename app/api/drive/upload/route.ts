import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    GoogleDriveManager,
    GoogleDriveError,
    QuotaExceededError,
} from "@/lib/google-drive";
import { getUserById } from "@/lib/supabase";

// ===== Constants =====

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES: Record<string, string[]> = {
    products: ["image/jpeg", "image/png", "image/webp"],
    videos: ["video/mp4", "video/quicktime", "video/webm"],
    audio: ["audio/mpeg", "audio/wav", "audio/mp3"],
    thumbnails: ["image/jpeg", "image/png", "image/webp"],
    scripts: ["application/json", "text/plain"],
};

const FOLDER_MAP: Record<string, string> = {
    products: "products",
    videos: "videos.originals",
    "videos-optimized": "videos.optimized",
    "videos-thumbnails": "videos.thumbnails",
    audio: "audio",
    scripts: "scripts",
};

// ===== Helper Functions =====

function getFolderIdFromPath(
    folders: Record<string, unknown>,
    path: string
): string | null {
    const parts = path.split(".");
    let current: unknown = folders;

    for (const part of parts) {
        if (typeof current === "object" && current !== null && part in current) {
            current = (current as Record<string, unknown>)[part];
        } else {
            return null;
        }
    }

    return typeof current === "string" ? current : null;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ===== Route Handler =====

/**
 * POST /api/drive/upload
 * อัปโหลดไฟล์ไป Google Drive
 */
export async function POST(request: NextRequest) {
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

        // 2. ดึง user และ folder structure จาก Supabase
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

        // 3. Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const targetFolder = formData.get("targetFolder") as string | null;
        const customFilename = formData.get("filename") as string | null;

        // 4. Validate inputs
        if (!file) {
            return NextResponse.json(
                { error: "ไม่พบไฟล์", code: "NO_FILE" },
                { status: 400 }
            );
        }

        if (!targetFolder || !FOLDER_MAP[targetFolder]) {
            return NextResponse.json(
                {
                    error: `โฟลเดอร์ไม่ถูกต้อง: ${targetFolder}`,
                    code: "INVALID_FOLDER",
                    validFolders: Object.keys(FOLDER_MAP),
                },
                { status: 400 }
            );
        }

        // 5. Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: `ไฟล์ใหญ่เกินไป (สูงสุด ${formatBytes(MAX_FILE_SIZE)})`,
                    code: "FILE_TOO_LARGE",
                    maxSize: MAX_FILE_SIZE,
                    fileSize: file.size,
                },
                { status: 400 }
            );
        }

        // 6. Validate file type
        const baseFolder = targetFolder.split("-")[0]; // e.g., "videos-optimized" -> "videos"
        const allowedTypes = ALLOWED_TYPES[baseFolder];

        if (allowedTypes && !allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error: `ประเภทไฟล์ไม่ถูกต้อง: ${file.type}`,
                    code: "INVALID_FILE_TYPE",
                    allowedTypes,
                },
                { status: 400 }
            );
        }

        // 7. Get target folder ID
        const folderPath = FOLDER_MAP[targetFolder];
        const folderId = getFolderIdFromPath(
            user.google_drive_folders as Record<string, unknown>,
            folderPath
        );

        if (!folderId) {
            return NextResponse.json(
                {
                    error: "ไม่พบโฟลเดอร์ปลายทาง",
                    code: "FOLDER_NOT_FOUND",
                },
                { status: 500 }
            );
        }

        // 8. Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 9. Upload to Google Drive
        const manager = new GoogleDriveManager(accessToken);
        const uploadedFile = await manager.uploadFile({
            file: buffer,
            filename: customFilename || file.name,
            mimeType: file.type,
            folderId: folderId,
        });

        // 10. Return success
        return NextResponse.json({
            success: true,
            message: "อัปโหลดสำเร็จ",
            fileId: uploadedFile.id,
            filename: uploadedFile.name,
            size: uploadedFile.size,
            sizeFormatted: formatBytes(uploadedFile.size),
            publicUrl: uploadedFile.publicUrl,
            thumbnailUrl: uploadedFile.thumbnailUrl,
            mimeType: uploadedFile.mimeType,
            createdAt: uploadedFile.createdAt,
        });
    } catch (error) {
        console.error("Upload error:", error);

        if (error instanceof QuotaExceededError) {
            return NextResponse.json(
                {
                    error: "พื้นที่ Google Drive เต็ม",
                    code: "QUOTA_EXCEEDED",
                },
                { status: 507 }
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
                error: "เกิดข้อผิดพลาดในการอัปโหลด",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

// ===== Config =====

export const config = {
    api: {
        bodyParser: false, // ใช้ formData แทน
    },
};
