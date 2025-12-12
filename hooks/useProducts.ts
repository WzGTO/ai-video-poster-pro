"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/types/database";

// ===== Types =====

interface UseProductsParams {
    search?: string;
    category?: string;
    inStock?: boolean;
    page?: number;
    limit?: number;
    includeStats?: boolean;
    includeCategories?: boolean;
}

interface UseProductsResult {
    products: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    categories: string[];
    stats: {
        total: number;
        inStock: number;
        outOfStock: number;
    } | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

interface UseSyncProductsResult {
    syncProducts: () => Promise<void>;
    isSyncing: boolean;
    syncResult: {
        synced: number;
        failed: number;
        created: number;
        updated: number;
    } | null;
    syncError: string | null;
}

// ===== useProducts Hook =====

export function useProducts(params: UseProductsParams = {}): UseProductsResult {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [categories, setCategories] = useState<string[]>([]);
    const [stats, setStats] = useState<{
        total: number;
        inStock: number;
        outOfStock: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();

            if (params.search) queryParams.set("search", params.search);
            if (params.category) queryParams.set("category", params.category);
            if (params.inStock !== undefined)
                queryParams.set("inStock", String(params.inStock));
            if (params.page) queryParams.set("page", String(params.page));
            if (params.limit) queryParams.set("limit", String(params.limit));
            if (params.includeStats) queryParams.set("includeStats", "true");
            if (params.includeCategories) queryParams.set("includeCategories", "true");

            const response = await fetch(`/api/products/list?${queryParams}`);

            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();

            setProducts(data.products || []);
            setPagination(
                data.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                }
            );

            if (data.categories) {
                setCategories(data.categories);
            }

            if (data.stats) {
                setStats({
                    total: data.stats.total || 0,
                    inStock: data.stats.inStock || 0,
                    outOfStock: data.stats.outOfStock || 0,
                });
            }
        } catch (err) {
            console.error("Fetch products error:", err);
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล");
        } finally {
            setIsLoading(false);
        }
    }, [
        params.search,
        params.category,
        params.inStock,
        params.page,
        params.limit,
        params.includeStats,
        params.includeCategories,
    ]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return {
        products,
        pagination,
        categories,
        stats,
        isLoading,
        error,
        refetch: fetchProducts,
    };
}

// ===== useSyncProducts Hook =====

export function useSyncProducts(): UseSyncProductsResult {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{
        synced: number;
        failed: number;
        created: number;
        updated: number;
    } | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const syncProducts = useCallback(async () => {
        setIsSyncing(true);
        setSyncResult(null);
        setSyncError(null);

        try {
            const response = await fetch("/api/products/sync", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === "TIKTOK_NOT_CONNECTED") {
                    throw new Error("กรุณาเชื่อมต่อ TikTok Shop ก่อน");
                }
                if (data.code === "FOLDERS_NOT_INITIALIZED") {
                    throw new Error("กรุณาสร้างโฟลเดอร์ Google Drive ก่อน");
                }
                throw new Error(data.error || "Sync failed");
            }

            setSyncResult({
                synced: data.synced || 0,
                failed: data.failed || 0,
                created: data.created || 0,
                updated: data.updated || 0,
            });
        } catch (err) {
            console.error("Sync error:", err);
            setSyncError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการ sync");
        } finally {
            setIsSyncing(false);
        }
    }, []);

    return {
        syncProducts,
        isSyncing,
        syncResult,
        syncError,
    };
}

// ===== useProduct Hook (Single product) =====

export function useProduct(productId: string | null): {
    product: Product | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
} {
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProduct = useCallback(async () => {
        if (!productId) {
            setProduct(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/products/${productId}`);

            if (!response.ok) {
                throw new Error("Failed to fetch product");
            }

            const data = await response.json();
            setProduct(data.product);
        } catch (err) {
            console.error("Fetch product error:", err);
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    return {
        product,
        isLoading,
        error,
        refetch: fetchProduct,
    };
}
