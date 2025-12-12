import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJsonFile, writeJsonFile, type Product } from "@/lib/google-drive";

/**
 * GET: ดึงรายการสินค้าจาก Google Drive
 * ข้อมูลทั้งหมดเก็บใน Google Drive ของผู้ใช้
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // อ่านไฟล์ products.json จาก Google Drive
        const products = await readJsonFile<Product[]>('products.json', []);

        return NextResponse.json(
            { products, count: products.length },
            {
                headers: {
                    "Cache-Control": "private, no-cache", // ไม่ cache เพราะข้อมูลอยู่บน Drive
                },
            }
        );
    } catch (error) {
        console.error("Failed to read products:", error);
        return NextResponse.json(
            { error: "Failed to read products from Google Drive" },
            { status: 500 }
        );
    }
}

/**
 * POST: Sync สินค้าจาก TikTok Shop และบันทึกลง Google Drive
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: เรียก TikTok Shop API จริง
        // ตอนนี้ใช้ mock data ก่อน
        const mockProducts: Product[] = [
            {
                id: "prod_1",
                productIdTiktok: "12345678",
                name: "ครีมหน้าใส Magic Glow",
                nameEn: "Magic Glow Brightening Cream",
                description: "ครีมบำรุงผิวหน้าให้ขาวใส ลดริ้วรอย เห็นผลใน 7 วัน",
                price: 299,
                currency: "THB",
                images: [
                    "https://via.placeholder.com/400x400?text=Product+1",
                    "https://via.placeholder.com/400x400?text=Product+1-2",
                ],
                stock: 50,
                category: "Beauty & Personal Care",
                commissionRate: 15,
                syncedAt: new Date().toISOString(),
            },
            {
                id: "prod_2",
                productIdTiktok: "87654321",
                name: "เสื้อยืด Cotton 100%",
                nameEn: "100% Cotton T-Shirt",
                description: "เสื้อยืดผ้าคอตตอน 100% สวมใส่สบาย ระบายอากาศได้ดี",
                price: 199,
                currency: "THB",
                images: [
                    "https://via.placeholder.com/400x400?text=Product+2",
                ],
                stock: 5,
                category: "Fashion",
                commissionRate: 10,
                syncedAt: new Date().toISOString(),
            },
            {
                id: "prod_3",
                productIdTiktok: "11223344",
                name: "กระเป๋าสะพายหนัง PU",
                nameEn: "PU Leather Shoulder Bag",
                description: "กระเป๋าสะพายหนัง PU คุณภาพดี ทรงสวย จุของได้เยอะ",
                price: 499,
                currency: "THB",
                images: [
                    "https://via.placeholder.com/400x400?text=Product+3",
                ],
                stock: 0,
                category: "Fashion Accessories",
                commissionRate: 20,
                syncedAt: new Date().toISOString(),
            },
        ];

        // อ่านสินค้าเดิมจาก Drive
        const existingProducts = await readJsonFile<Product[]>('products.json', []);

        // Merge ข้อมูลใหม่เข้ากับข้อมูลเดิม
        const productMap = new Map(existingProducts.map(p => [p.productIdTiktok, p]));

        mockProducts.forEach(newProduct => {
            productMap.set(newProduct.productIdTiktok, newProduct);
        });

        const updatedProducts = Array.from(productMap.values());

        // บันทึกลง Google Drive
        await writeJsonFile('products.json', updatedProducts);

        return NextResponse.json({
            success: true,
            products: updatedProducts,
            count: updatedProducts.length,
            message: "บันทึกสินค้าลง Google Drive เรียบร้อย",
        });
    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync products to Google Drive" },
            { status: 500 }
        );
    }
}
