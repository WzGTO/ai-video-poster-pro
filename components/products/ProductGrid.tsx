"use client";

import Image from "next/image";
import { Video, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

interface ProductGridProps {
    products: Product[];
    isLoading: boolean;
    onProductClick: (product: Product) => void;
    onCreateVideo: (product: Product) => void;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    onPageChange?: (page: number) => void;
}

export function ProductGrid({
    products,
    isLoading,
    onProductClick,
    onCreateVideo,
    pagination,
    onPageChange,
}: ProductGridProps) {
    // Skeleton loading
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Empty state
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    ยังไม่มีสินค้า
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    เชื่อมต่อ TikTok Shop และกดปุ่ม "Sync จาก TikTok Shop"
                    เพื่อนำเข้าสินค้าของคุณ
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => onProductClick(product)}
                        onCreateVideo={() => onCreateVideo(product)}
                    />
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrev}
                        onClick={() => onPageChange?.(pagination.page - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }).map((_, i) => {
                            const pageNum = i + 1;
                            // Show first, last, current, and nearby pages
                            if (
                                pageNum === 1 ||
                                pageNum === pagination.totalPages ||
                                Math.abs(pageNum - pagination.page) <= 1
                            ) {
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={pageNum === pagination.page ? "default" : "ghost"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => onPageChange?.(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            }
                            // Show ellipsis
                            if (
                                pageNum === 2 ||
                                pageNum === pagination.totalPages - 1
                            ) {
                                return (
                                    <span key={pageNum} className="px-2 text-gray-400">
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNext}
                        onClick={() => onPageChange?.(pagination.page + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

// ===== Product Card =====

interface ProductCardProps {
    product: Product;
    onClick: () => void;
    onCreateVideo: () => void;
}

function ProductCard({ product, onClick, onCreateVideo }: ProductCardProps) {
    const stockStatus = getStockStatus(product.stock);

    return (
        <div
            className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {product.images[0] ? (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                )}

                {/* Stock Badge */}
                <div
                    className={cn(
                        "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium",
                        stockStatus.className
                    )}
                >
                    {stockStatus.label}
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                {/* Category */}
                {product.category && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {product.category}
                    </p>
                )}

                {/* Name */}
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ฿{product.price.toLocaleString()}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                            ฿{product.original_price.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Create Video Button */}
                <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCreateVideo();
                    }}
                >
                    <Video className="h-4 w-4 mr-2" />
                    สร้างวิดีโอ
                </Button>
            </div>
        </div>
    );
}

// ===== Skeleton =====

function ProductSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
        </div>
    );
}

// ===== Helper =====

function getStockStatus(stock: number): {
    label: string;
    className: string;
} {
    if (stock === 0) {
        return {
            label: "❌ หมด",
            className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
        };
    }
    if (stock <= 10) {
        return {
            label: "⚠️ ใกล้หมด",
            className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
        };
    }
    return {
        label: "✅ มีสต็อก",
        className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
    };
}
