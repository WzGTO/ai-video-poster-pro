import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProducts, getProductStats, getProductCategories } from "@/lib/db/products";

/**
 * GET /api/products/list
 * ดึงรายการสินค้าพร้อม filters และ pagination
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
        const search = searchParams.get("search") || undefined;
        const category = searchParams.get("category") || undefined;
        const inStockParam = searchParams.get("inStock");
        const isActiveParam = searchParams.get("isActive");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const includeStats = searchParams.get("includeStats") === "true";
        const includeCategories = searchParams.get("includeCategories") === "true";

        // 3. Build filters
        const filters: {
            search?: string;
            category?: string;
            inStock?: boolean;
            isActive?: boolean;
        } = {};

        if (search) {
            filters.search = search;
        }

        if (category) {
            filters.category = category;
        }

        if (inStockParam !== null) {
            filters.inStock = inStockParam === "true";
        }

        if (isActiveParam !== null) {
            filters.isActive = isActiveParam === "true";
        }

        // 4. Get products with pagination
        const result = await getProducts(userId, filters, { page, limit });

        // 5. Get optional stats and categories
        let stats = null;
        let categories: string[] = [];

        if (includeStats) {
            stats = await getProductStats(userId);
        }

        if (includeCategories) {
            categories = await getProductCategories(userId);
        }

        // 6. Return response
        return NextResponse.json({
            success: true,
            products: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.page < result.totalPages,
                hasPrev: result.page > 1,
            },
            ...(stats && { stats }),
            ...(categories.length > 0 && { categories }),
        });
    } catch (error) {
        console.error("Get products error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
