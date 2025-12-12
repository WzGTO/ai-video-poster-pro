import { supabase } from "@/lib/supabase";
import type {
    Product,
    ProductFilters,
    ProductData,
    TikTokProduct,
    PaginationParams,
    PaginatedResult,
    SyncSummary,
} from "@/types/database";

// ===== Product Functions =====

/**
 * ดึงสินค้าทั้งหมดของ user พร้อม filters และ pagination
 */
export async function getProducts(
    userId: string,
    filters?: ProductFilters,
    pagination?: PaginationParams
): Promise<PaginatedResult<Product>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

    // Apply filters
    if (filters?.category) {
        query = query.eq("category", filters.category);
    }

    if (filters?.inStock !== undefined) {
        if (filters.inStock) {
            query = query.gt("stock", 0);
        } else {
            query = query.eq("stock", 0);
        }
    }

    if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
    }

    if (filters?.search) {
        query = query.or(
            `name.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
    }

    // Apply pagination and sorting
    query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Failed to get products: ${error.message}`);
    }

    const total = count || 0;

    return {
        data: (data as Product[]) || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * ดึงสินค้าตาม ID
 */
export async function getProductById(
    productId: string,
    userId: string
): Promise<Product | null> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("user_id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        throw new Error(`Failed to get product: ${error.message}`);
    }

    return data as Product;
}

/**
 * ดึงสินค้าตาม TikTok Product ID
 */
export async function getProductByTikTokId(
    tiktokProductId: string,
    userId: string
): Promise<Product | null> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tiktok_product_id", tiktokProductId)
        .eq("user_id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        throw new Error(`Failed to get product: ${error.message}`);
    }

    return data as Product;
}

/**
 * สร้างสินค้าใหม่
 */
export async function createProduct(
    userId: string,
    productData: ProductData
): Promise<Product> {
    const { data, error } = await supabase
        .from("products")
        .insert({
            user_id: userId,
            ...productData,
            currency: productData.currency || "THB",
            images: productData.images || [],
            stock: productData.stock || 0,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create product: ${error.message}`);
    }

    return data as Product;
}

/**
 * อัปเดตสินค้า
 */
export async function updateProduct(
    productId: string,
    userId: string,
    updates: Partial<ProductData>
): Promise<Product> {
    const { data, error } = await supabase
        .from("products")
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update product: ${error.message}`);
    }

    return data as Product;
}

/**
 * ลบสินค้า
 */
export async function deleteProduct(
    productId: string,
    userId: string
): Promise<boolean> {
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
    }

    return true;
}

/**
 * Sync สินค้าจาก TikTok Shop API (Upsert)
 */
export async function syncProductsFromTikTok(
    userId: string,
    tiktokProducts: TikTokProduct[]
): Promise<SyncSummary> {
    const summary: SyncSummary = {
        total: tiktokProducts.length,
        created: 0,
        updated: 0,
        errors: 0,
        products: [],
    };

    for (const tiktokProduct of tiktokProducts) {
        try {
            // ตรวจสอบว่ามีสินค้านี้อยู่แล้วหรือไม่
            const existingProduct = await getProductByTikTokId(
                tiktokProduct.id,
                userId
            );

            const productData: ProductData = {
                tiktok_product_id: tiktokProduct.id,
                name: tiktokProduct.title,
                description: tiktokProduct.description,
                price: tiktokProduct.price,
                original_price: tiktokProduct.original_price,
                currency: tiktokProduct.currency || "THB",
                images: tiktokProduct.images,
                stock: tiktokProduct.stock_info?.available_stock || 0,
                category: tiktokProduct.category?.name,
            };

            if (existingProduct) {
                // อัปเดตสินค้าที่มีอยู่
                const updated = await updateProduct(existingProduct.id, userId, {
                    ...productData,
                });

                // อัปเดต synced_at
                await supabase
                    .from("products")
                    .update({ synced_at: new Date().toISOString() })
                    .eq("id", existingProduct.id);

                summary.updated++;
                summary.products.push(updated);
            } else {
                // สร้างสินค้าใหม่
                const created = await createProduct(userId, productData);

                // อัปเดต synced_at
                await supabase
                    .from("products")
                    .update({ synced_at: new Date().toISOString() })
                    .eq("id", created.id);

                summary.created++;
                summary.products.push(created);
            }
        } catch (error) {
            console.error(`Error syncing product ${tiktokProduct.id}:`, error);
            summary.errors++;
        }
    }

    return summary;
}

/**
 * ดึง categories ที่ใช้อยู่
 */
export async function getProductCategories(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("user_id", userId)
        .not("category", "is", null);

    if (error) {
        throw new Error(`Failed to get categories: ${error.message}`);
    }

    const categories = new Set(
        data?.map((p) => p.category).filter(Boolean) || []
    );
    return Array.from(categories) as string[];
}

/**
 * ดึงสถิติสินค้า
 */
export async function getProductStats(userId: string): Promise<{
    total: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
}> {
    const { data, error } = await supabase
        .from("products")
        .select("stock")
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to get stats: ${error.message}`);
    }

    const products = data || [];

    return {
        total: products.length,
        inStock: products.filter((p) => p.stock > 10).length,
        outOfStock: products.filter((p) => p.stock === 0).length,
        lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    };
}

/**
 * Toggle สถานะ active ของสินค้า
 */
export async function toggleProductActive(
    productId: string,
    userId: string
): Promise<Product> {
    // ดึงสถานะปัจจุบัน
    const product = await getProductById(productId, userId);
    if (!product) {
        throw new Error("Product not found");
    }

    // Toggle
    return updateProduct(productId, userId, {
        // We need to cast since is_active is not in ProductData
    } as ProductData);
}
