import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    TikTokShopAPI,
    TikTokApiError,
    TikTokAuthError,
    downloadImage,
    getMimeTypeFromUrl,
    convertTikTokProduct,
} from "@/lib/tiktok/shop-api";
import { GoogleDriveManager } from "@/lib/google-drive";
import { getUserById } from "@/lib/db/users";
import { syncProductsFromTikTok } from "@/lib/db/products";
import { supabase } from "@/lib/supabase";
import { revalidateCache } from "@/lib/cache/api-cache";

// ===== Types =====

interface SyncResult {
    synced: number;
    failed: number;
    created: number;
    updated: number;
    products: Array<{
        id: string;
        name: string;
        status: "success" | "failed";
        error?: string;
    }>;
}

// ===== Route Handler =====

/**
 * POST /api/products/sync
 * Sync products from TikTok Shop
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

        // 2. ตรวจสอบว่ามี TikTok token หรือไม่
        const { data: userTokens } = await supabase
            .from("user_tokens")
            .select("*")
            .eq("user_id", userId)
            .eq("provider", "tiktok")
            .single();

        if (!userTokens?.access_token) {
            return NextResponse.json(
                {
                    error: "กรุณาเชื่อมต่อ TikTok Shop ก่อน",
                    code: "TIKTOK_NOT_CONNECTED",
                    action: "connect_tiktok",
                },
                { status: 400 }
            );
        }

        // 3. ตรวจสอบว่ามี Drive folders หรือยัง
        const user = await getUserById(userId);
        if (!user?.google_drive_folders) {
            return NextResponse.json(
                {
                    error: "กรุณาสร้างโฟลเดอร์ Google Drive ก่อน",
                    code: "FOLDERS_NOT_INITIALIZED",
                    action: "init_drive",
                },
                { status: 400 }
            );
        }

        // 4. สร้าง TikTok API client
        const tiktokApi = new TikTokShopAPI(
            userTokens.access_token,
            userTokens.shop_id
        );

        // 5. ดึงสินค้าจาก TikTok Shop
        const tiktokProducts = await tiktokApi.getAllProducts();

        if (tiktokProducts.length === 0) {
            return NextResponse.json({
                success: true,
                message: "ไม่พบสินค้าใน TikTok Shop",
                synced: 0,
                failed: 0,
                products: [],
            });
        }

        // 6. สร้าง Google Drive manager
        const driveManager = new GoogleDriveManager(accessToken);
        const productsFolderId = user.google_drive_folders.products;

        // 7. Process each product
        const result: SyncResult = {
            synced: 0,
            failed: 0,
            created: 0,
            updated: 0,
            products: [],
        };

        const productsToSync = [];

        for (const tiktokProduct of tiktokProducts) {
            try {
                // Convert to our format
                const productData = convertTikTokProduct(tiktokProduct);

                // Download and upload images to Drive
                const driveImageUrls: string[] = [];

                for (let i = 0; i < tiktokProduct.images.length; i++) {
                    const image = tiktokProduct.images[i];
                    try {
                        // Download image
                        const imageBuffer = await downloadImage(image.url);
                        const mimeType = getMimeTypeFromUrl(image.url);
                        const filename = `${tiktokProduct.id}_image_${i + 1}.${mimeType.split("/")[1]}`;

                        // Upload to Drive
                        const uploadedFile = await driveManager.uploadFile({
                            file: imageBuffer,
                            filename,
                            mimeType,
                            folderId: productsFolderId,
                            description: `Product image for ${tiktokProduct.title}`,
                        });

                        driveImageUrls.push(uploadedFile.publicUrl);
                    } catch (imgError) {
                        console.error(`Failed to upload image for ${tiktokProduct.id}:`, imgError);
                        // Keep original URL if upload fails
                        driveImageUrls.push(image.url);
                    }
                }

                // Update product data with Drive URLs
                productData.images = driveImageUrls;

                productsToSync.push({
                    id: tiktokProduct.id,
                    ...productData,
                });

                result.products.push({
                    id: tiktokProduct.id,
                    name: tiktokProduct.title,
                    status: "success",
                });
            } catch (error) {
                console.error(`Failed to process product ${tiktokProduct.id}:`, error);
                result.failed++;
                result.products.push({
                    id: tiktokProduct.id,
                    name: tiktokProduct.title,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        // 8. Sync to database
        const syncSummary = await syncProductsFromTikTok(
            userId,
            productsToSync.map((p) => ({
                id: p.id,
                title: p.name,
                description: p.description,
                price: p.price,
                original_price: p.original_price,
                currency: p.currency,
                images: p.images,
                stock_info: { available_stock: p.stock },
                category: p.category ? { name: p.category } : undefined,
            }))
        );

        result.synced = syncSummary.created + syncSummary.updated;
        result.created = syncSummary.created;
        result.updated = syncSummary.updated;
        result.failed += syncSummary.errors;

        // 9. Revalidate products cache
        await revalidateCache('products');

        // 10. Return result
        return NextResponse.json({
            success: true,
            message: `ซิงค์สินค้าสำเร็จ ${result.synced} รายการ`,
            ...result,
        });
    } catch (error) {
        console.error("Product sync error:", error);

        if (error instanceof TikTokAuthError) {
            return NextResponse.json(
                {
                    error: "TikTok token หมดอายุ กรุณาเชื่อมต่อใหม่",
                    code: "TIKTOK_TOKEN_EXPIRED",
                    action: "reconnect_tiktok",
                },
                { status: 401 }
            );
        }

        if (error instanceof TikTokApiError) {
            return NextResponse.json(
                {
                    error: error.message,
                    code: "TIKTOK_API_ERROR",
                    tiktokCode: error.code,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการซิงค์สินค้า",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
