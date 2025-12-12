// TikTok Shop API Integration
// Documentation: https://developers.tiktok.com/doc/tiktok-shop-api

// ===== Types =====

export interface TikTokProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    original_price?: number;
    currency: string;
    images: TikTokImage[];
    stock_info: {
        available_stock: number;
        warehouse_id?: string;
    };
    category: {
        id: string;
        name: string;
    };
    status: "LIVE" | "DRAFT" | "SUSPENDED" | "DELETED";
    create_time: number;
    update_time: number;
}

export interface TikTokImage {
    id: string;
    url: string;
    width?: number;
    height?: number;
}

export interface TikTokProductDetail extends TikTokProduct {
    commission_rate?: number;
    skus: TikTokSku[];
    attributes?: Record<string, string>;
    seller_sku?: string;
    package_weight?: number;
    package_dimensions?: {
        length: number;
        width: number;
        height: number;
    };
}

export interface TikTokSku {
    id: string;
    seller_sku: string;
    price: number;
    stock_info: {
        available_stock: number;
    };
    sales_attributes?: Array<{
        attribute_name: string;
        value_name: string;
    }>;
}

export interface TikTokApiResponse<T> {
    code: number;
    message: string;
    data: T;
    request_id: string;
}

export interface ProductListResponse {
    products: TikTokProduct[];
    total_count: number;
    next_page_token?: string;
}

export interface GetProductsParams {
    page?: number;
    page_size?: number;
    category_id?: string;
    status?: string;
    search_keyword?: string;
}

// ===== Custom Errors =====

export class TikTokApiError extends Error {
    constructor(
        message: string,
        public code: number,
        public requestId?: string
    ) {
        super(message);
        this.name = "TikTokApiError";
    }
}

export class TikTokAuthError extends TikTokApiError {
    constructor(message: string = "TikTok authentication required") {
        super(message, 401);
        this.name = "TikTokAuthError";
    }
}

// ===== TikTok Shop API Class =====

const TIKTOK_API_BASE = "https://open-api.tiktokglobalshop.com";

export class TikTokShopAPI {
    private accessToken: string;
    private shopId: string;

    constructor(accessToken: string, shopId?: string) {
        if (!accessToken) {
            throw new TikTokAuthError("Access token is required");
        }
        this.accessToken = accessToken;
        this.shopId = shopId || "";
    }

    /**
     * Make authenticated API request
     */
    private async request<T>(
        endpoint: string,
        method: "GET" | "POST" = "GET",
        body?: unknown
    ): Promise<T> {
        const url = new URL(`${TIKTOK_API_BASE}${endpoint}`);

        // Add required query params
        url.searchParams.set("app_key", process.env.TIKTOK_CLIENT_KEY || "");
        url.searchParams.set("timestamp", Math.floor(Date.now() / 1000).toString());
        url.searchParams.set("shop_id", this.shopId);

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            "x-tts-access-token": this.accessToken,
        };

        const options: RequestInit = {
            method,
            headers,
        };

        if (body && method === "POST") {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url.toString(), options);
            const data: TikTokApiResponse<T> = await response.json();

            if (data.code !== 0) {
                throw new TikTokApiError(
                    data.message || "TikTok API error",
                    data.code,
                    data.request_id
                );
            }

            return data.data;
        } catch (error) {
            if (error instanceof TikTokApiError) {
                throw error;
            }
            throw new TikTokApiError(
                `Failed to call TikTok API: ${error instanceof Error ? error.message : "Unknown error"}`,
                500
            );
        }
    }

    /**
     * Get products list with pagination
     */
    async getProducts(params?: GetProductsParams): Promise<{
        products: TikTokProduct[];
        total: number;
        hasMore: boolean;
    }> {
        const page = params?.page || 1;
        const pageSize = params?.page_size || 20;

        try {
            const response = await this.request<ProductListResponse>(
                "/product/202309/products/search",
                "POST",
                {
                    page_size: pageSize,
                    page_token: page > 1 ? String((page - 1) * pageSize) : undefined,
                    filter: {
                        status: params?.status || "LIVE",
                        category_id: params?.category_id,
                    },
                }
            );

            return {
                products: response.products || [],
                total: response.total_count || 0,
                hasMore: !!response.next_page_token,
            };
        } catch (error) {
            console.error("TikTok getProducts error:", error);
            throw error;
        }
    }

    /**
     * Get all products (handles pagination automatically)
     */
    async getAllProducts(): Promise<TikTokProduct[]> {
        const allProducts: TikTokProduct[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const { products, hasMore: more } = await this.getProducts({
                page,
                page_size: 100,
            });

            allProducts.push(...products);
            hasMore = more;
            page++;

            // Safety limit
            if (page > 50) {
                console.warn("Reached maximum page limit");
                break;
            }
        }

        return allProducts;
    }

    /**
     * Get product detail by ID
     */
    async getProductDetail(productId: string): Promise<TikTokProductDetail> {
        try {
            const response = await this.request<TikTokProductDetail>(
                `/product/202309/products/${productId}`,
                "GET"
            );

            return response;
        } catch (error) {
            console.error(`TikTok getProductDetail error for ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Search products by keyword
     */
    async searchProducts(keyword: string): Promise<TikTokProduct[]> {
        try {
            const response = await this.request<ProductListResponse>(
                "/product/202309/products/search",
                "POST",
                {
                    page_size: 50,
                    search_keyword: keyword,
                }
            );

            return response.products || [];
        } catch (error) {
            console.error("TikTok searchProducts error:", error);
            throw error;
        }
    }

    /**
     * Get product categories
     */
    async getCategories(): Promise<
        Array<{ id: string; name: string; parent_id?: string }>
    > {
        try {
            const response = await this.request<{
                categories: Array<{ id: string; local_name: string; parent_id?: string }>;
            }>("/product/202309/categories", "GET");

            return (response.categories || []).map((cat) => ({
                id: cat.id,
                name: cat.local_name,
                parent_id: cat.parent_id,
            }));
        } catch (error) {
            console.error("TikTok getCategories error:", error);
            throw error;
        }
    }
}

// ===== Helper Functions =====

/**
 * Download image from URL and return as Buffer
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Get MIME type from URL
 */
export function getMimeTypeFromUrl(url: string): string {
    const extension = url.split(".").pop()?.toLowerCase().split("?")[0];

    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
    };

    return mimeTypes[extension || ""] || "image/jpeg";
}

/**
 * Convert TikTok product to our product format
 */
export function convertTikTokProduct(
    tiktokProduct: TikTokProduct
): {
    tiktok_product_id: string;
    name: string;
    description: string;
    price: number;
    original_price?: number;
    currency: string;
    images: string[];
    stock: number;
    category?: string;
} {
    return {
        tiktok_product_id: tiktokProduct.id,
        name: tiktokProduct.title,
        description: tiktokProduct.description,
        price: tiktokProduct.price,
        original_price: tiktokProduct.original_price,
        currency: tiktokProduct.currency || "THB",
        images: tiktokProduct.images.map((img) => img.url),
        stock: tiktokProduct.stock_info?.available_stock || 0,
        category: tiktokProduct.category?.name,
    };
}

// ===== Factory =====

export function createTikTokShopAPI(
    accessToken: string,
    shopId?: string
): TikTokShopAPI {
    return new TikTokShopAPI(accessToken, shopId);
}
