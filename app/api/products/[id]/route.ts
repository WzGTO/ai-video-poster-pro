import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProductById, deleteProduct, updateProduct } from "@/lib/db/products";
import { getVideosByProduct } from "@/lib/db/videos";
import { GoogleDriveManager } from "@/lib/google-drive";

// ===== Route Handlers =====

/**
 * GET /api/products/[id]
 * ดึงรายละเอียดสินค้า
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

        // 2. ดึงข้อมูลสินค้า
        const product = await getProductById(id, userId);

        if (!product) {
            return NextResponse.json(
                { error: "ไม่พบสินค้า", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // 3. ดึง videos ที่เกี่ยวข้อง
        const videos = await getVideosByProduct(id, userId);

        // 4. Return response
        return NextResponse.json({
            success: true,
            product,
            relatedVideos: videos,
            videoCount: videos.length,
        });
    } catch (error) {
        console.error("Get product error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/products/[id]
 * อัปเดตสินค้า
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

        // 2. ตรวจสอบว่าสินค้ามีอยู่
        const existingProduct = await getProductById(id, userId);

        if (!existingProduct) {
            return NextResponse.json(
                { error: "ไม่พบสินค้า", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // 3. Parse request body
        const body = await request.json();
        const allowedFields = [
            "name",
            "name_en",
            "description",
            "price",
            "original_price",
            "stock",
            "category",
            "is_active",
        ];

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

        // 4. อัปเดตสินค้า
        const updatedProduct = await updateProduct(id, userId, updates);

        return NextResponse.json({
            success: true,
            message: "อัปเดตสินค้าสำเร็จ",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Update product error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการอัปเดตสินค้า",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/products/[id]
 * ลบสินค้า (ลบรูปจาก Drive ด้วย)
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

        // 2. ดึงข้อมูลสินค้า
        const product = await getProductById(id, userId);

        if (!product) {
            return NextResponse.json(
                { error: "ไม่พบสินค้า", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // 3. ตรวจสอบ query params
        const { searchParams } = new URL(request.url);
        const deleteImages = searchParams.get("deleteImages") !== "false";

        // 4. ลบรูปจาก Google Drive (ถ้าต้องการ)
        const deletedImages: string[] = [];
        const failedImages: string[] = [];

        if (deleteImages && product.images.length > 0) {
            const driveManager = new GoogleDriveManager(accessToken);

            for (const imageUrl of product.images) {
                try {
                    // Extract file ID from Drive URL
                    const match = imageUrl.match(/id=([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        const fileId = match[1];
                        await driveManager.deleteFile(fileId);
                        deletedImages.push(fileId);
                    }
                } catch (imgError) {
                    console.error(`Failed to delete image: ${imageUrl}`, imgError);
                    failedImages.push(imageUrl);
                }
            }
        }

        // 5. ลบสินค้าจาก database
        await deleteProduct(id, userId);

        return NextResponse.json({
            success: true,
            message: "ลบสินค้าสำเร็จ",
            productId: id,
            imagesDeleted: deletedImages.length,
            imagesFailed: failedImages.length,
        });
    } catch (error) {
        console.error("Delete product error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการลบสินค้า",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
