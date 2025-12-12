import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleDriveManager, GoogleDriveError } from "@/lib/google-drive";
import {
    findOrCreateUser,
    updateUserFolders,
    getUserById,
} from "@/lib/supabase";

/**
 * POST /api/drive/init
 * Initialize Google Drive folder structure
 */
export async function POST() {
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

        // 2. หรือสร้าง user ใน Supabase
        const user = await findOrCreateUser(
            userId,
            session.user.email || "",
            session.user.name,
            session.user.image
        );

        if (!user) {
            return NextResponse.json(
                { error: "ไม่สามารถสร้างผู้ใช้ได้", code: "USER_CREATE_FAILED" },
                { status: 500 }
            );
        }

        // 3. ตรวจสอบว่าเคยสร้าง folder แล้วหรือยัง
        if (user.google_drive_folder_id && user.google_drive_folders) {
            // ตรวจสอบว่า folder ยังมีอยู่ใน Drive หรือไม่
            try {
                const manager = new GoogleDriveManager(accessToken);
                const files = await manager.listFiles(user.google_drive_folder_id);

                // folder ยังมีอยู่
                return NextResponse.json({
                    success: true,
                    message: "พบโฟลเดอร์ที่มีอยู่แล้ว",
                    folderId: user.google_drive_folder_id,
                    subfolderIds: user.google_drive_folders,
                    isNew: false,
                });
            } catch {
                // folder ถูกลบไปแล้ว - ต้องสร้างใหม่
                console.log("Previous folder not found, creating new one...");
            }
        }

        // 4. สร้าง folder structure ใหม่
        const manager = new GoogleDriveManager(accessToken);
        const folders = await manager.initializeFolder();

        // 5. บันทึกลง Supabase
        const updated = await updateUserFolders(userId, folders.root, folders);

        if (!updated) {
            return NextResponse.json(
                {
                    error: "ไม่สามารถบันทึกข้อมูลได้",
                    code: "DB_UPDATE_FAILED",
                },
                { status: 500 }
            );
        }

        // 6. Return success
        return NextResponse.json({
            success: true,
            message: "สร้างโฟลเดอร์สำเร็จ",
            folderId: folders.root,
            subfolderIds: folders,
            isNew: true,
        });
    } catch (error) {
        console.error("Drive init error:", error);

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
                error: "เกิดข้อผิดพลาดในการสร้างโฟลเดอร์",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/drive/init
 * Check if folders are initialized
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const user = await getUserById(session.user.id);

        if (!user) {
            return NextResponse.json({
                initialized: false,
                message: "ยังไม่ได้สร้างโฟลเดอร์",
            });
        }

        return NextResponse.json({
            initialized: !!user.google_drive_folder_id,
            folderId: user.google_drive_folder_id,
            subfolderIds: user.google_drive_folders,
        });
    } catch (error) {
        console.error("Drive init check error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาด", code: "UNKNOWN_ERROR" },
            { status: 500 }
        );
    }
}
