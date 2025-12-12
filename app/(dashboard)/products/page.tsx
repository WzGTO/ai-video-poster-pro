"use client";

import { useState, useCallback } from "react";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { useProducts, useSyncProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/database";

export default function ProductsPage() {
    // State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [stockFilter, setStockFilter] = useState<string>("");
    const [page, setPage] = useState(1);

    // Hooks
    const {
        products,
        pagination,
        categories,
        stats,
        isLoading,
        error,
        refetch,
    } = useProducts({
        search: searchQuery,
        category: categoryFilter,
        inStock: stockFilter === "in_stock" ? true : stockFilter === "out_of_stock" ? false : undefined,
        page,
        limit: 12,
        includeStats: true,
        includeCategories: true,
    });

    const {
        syncProducts,
        isSyncing,
        syncResult,
        syncError,
    } = useSyncProducts();

    // Handlers
    const handleSync = async () => {
        await syncProducts();
        refetch();
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setPage(1);
    };

    const handleCategoryChange = (category: string) => {
        setCategoryFilter(category);
        setPage(1);
    };

    const handleStockChange = (stock: string) => {
        setStockFilter(stock);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCreateVideo = useCallback((product: Product) => {
        // Navigate to video creation with product
        window.location.href = `/dashboard/videos/create?productId=${product.id}`;
    }, []);

    const handleProductUpdate = () => {
        refetch();
        setSelectedProduct(null);
    };

    return (
        <div className="space-y-6">
            {/* Header with sync, search, filters */}
            <ProductsHeader
                onSync={handleSync}
                isSyncing={isSyncing}
                syncResult={syncResult}
                searchQuery={searchQuery}
                onSearchChange={handleSearch}
                categoryFilter={categoryFilter}
                onCategoryChange={handleCategoryChange}
                categories={categories}
                stockFilter={stockFilter}
                onStockChange={handleStockChange}
                stats={stats}
            />

            {/* Error message */}
            {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                    <p>{error}</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        ลองใหม่
                    </button>
                </div>
            )}

            {/* Sync error */}
            {syncError && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                    <p>{syncError}</p>
                </div>
            )}

            {/* Product grid */}
            <ProductGrid
                products={products}
                isLoading={isLoading}
                onProductClick={handleProductClick}
                onCreateVideo={handleCreateVideo}
                pagination={pagination}
                onPageChange={handlePageChange}
            />

            {/* Product detail modal */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={handleCloseModal}
                    onCreateVideo={handleCreateVideo}
                    onUpdate={handleProductUpdate}
                />
            )}
        </div>
    );
}
